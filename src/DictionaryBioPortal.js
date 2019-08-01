const Dictionary = require('vsm-dictionary');
const { hasProperEntrySortProperty, hasProperFilterDictIDProperty,
  hasProperFilterIDProperty, hasProperPageProperty, hasPagePropertyEqualToOne,
  hasProperPerPageProperty, hasProperSortDictIDProperty, str_cmp,
  fixedEncodeURIComponent, isJSONString, getLastPartOfURL } = require('./fun');

module.exports = class DictionaryBioPortal extends Dictionary {

  constructor(options) {
    const opt = options || {};
    super(opt);

    const baseURL = opt.baseURL || 'http://data.bioontology.org';

    // enable the console.log() usage
    this.enableLogging = opt.log || false;

    // an API key must provided to get data from BioPortal
    this.key = opt.apiKey || {};

    // the context-related info is needed for matching to VSM objects
    this.noContextField = 'display_context=false';

    // BioPortal's default API values
    this.bioPortalDefaultPage = 1;
    this.bioPortalDefaultPageSize = 50;

    /** hacked value, largest found in BioPortal was 109 for the
     * id: 'http://www.w3.org/2002/07/owl#Thing' (March 2019), so I
     * added a little more for safety
     */
    this.bioPortalMaximumOntologiesNumWithSameID = 130; // hacked value
    this.bioPortalMaximumPageSize = 5000;

    this.urlGetDictInfos = opt.urlGetDictInfos || baseURL + '/ontologies/';

    this.urlGetEntries = opt.urlGetEntries
      || baseURL + '/search?q=$idString' + '&ontologies=$dictIDs';
    this.urlGetEntriesFromProperties = opt.urlGetEntriesFromProperties
      || baseURL + '/property_search?q=$idString' + '&ontologies=$dictIDs';

    this.urlGetMatches = opt.urlGetMatches
      || baseURL + '/search?q=$queryString';
    this.urlGetMatchesFromProperties = opt.urlGetMatchesFromProperties
      || baseURL + '/property_search?q=$queryString';
  }

  getDictInfos(options, cb) {
    const page = this.getPage(options);
    const pagesize = this.getPageSize(options);

    let urlArray = this.buildDictInfoURLs(options);

    // prune common urls (e.g. when someone evil asks for an ontology twice)
    urlArray = Array.from(new Set(urlArray));
    let callsRemaining = urlArray.length;

    // cover the cases where you don't even need to send a query to BioPortal
    if (callsRemaining > 1 && page > 1) {
      const firstExpectedResIndex = (page - 1) * pagesize;
      if (callsRemaining <= firstExpectedResIndex) {
        return cb(null, {items: []});
      }
    }

    const urlToResultsMap = new Map();
    let answered = false;

    for (let url of urlArray) {
      if (this.enableLogging)
        console.log('URL: ' + url);

      urlToResultsMap.set(url, []);

      this.request(url, (err, res) => {
        if (err) {
          if (err.status === 404
            && err.errors[0] === 'You must provide a valid `acronym` to retrieve an ontology') {
            err = null; // `res` is already set to []
          } else {
            if (!answered) {
              answered = true;
              --callsRemaining;
              return cb(err);
            }
          }
        } else {
          urlToResultsMap.set(url, this.mapBioPortalResToDictInfoObj(res));
        }

        --callsRemaining;
        // all calls have returned, so trim results
        if (callsRemaining <= 0) {
          // gather all results in one array
          let arr = [];
          for (let dictInfoObjArray of urlToResultsMap.values())
            arr = arr.concat(dictInfoObjArray);

          arr = this.trimDictInfoArray(arr, page, pagesize);

          if (!answered) cb(err, {items: arr});
        }
      });
    }
  }

  getEntries(options, cb) {
    // Hack option for getting proper sorted results from BioPortal
    // when requesting for an entry by id (with or without dictID)
    options.getAllResults = options.getAllResults || false;

    if ((options.getAllResults) && hasProperFilterIDProperty(options)) {
      options.page = 1;
      options.perPage = this.hijackPageSize(options);
      console.log('Hijacking options: page = ' + options.page + ', perPage = '
                                               + options.perPage);
    }

    const urlArray = this.buildEntryURLs(options);
    let callsRemaining = urlArray.length;
    const urlToResultsMap = new Map();

    for (let url of urlArray) {
      if (this.enableLogging)
        console.log('URL: ' + url);

      urlToResultsMap.set(url, []);

      this.request(url, (err, res) => {
        if (err) return cb(err);

        if (url.includes('/property_search'))
          urlToResultsMap.set(
            url, this.mapBioPortalPropertySearchResToEntryObj(res, options)
          );
        else
          urlToResultsMap.set(
            url, this.mapBioPortalSearchResToEntryObj(res, options)
          );

        --callsRemaining;
        // all calls have returned, so sort and trim results
        if (callsRemaining <= 0) {
          // gather all results in one array
          let arr = [];
          for (let entryObjArray of urlToResultsMap.values())
            arr = arr.concat(entryObjArray);

          // Sort only if the request was for specific id(s)
          // and getAllResults hack is enabled (disabled because
          // of the existence of common IDs between ontologies)
          /*if (
            options.getAllResults
            && hasProperFilterIDProperty(options)
          ) {
            console.log('Sorting in client...');
            arr = this.sortEntries(arr, options);
          }*/

          // re-arrange if possible the returned results when requesting
          // entries by id, in case that some of them share the same id
          if (hasProperFilterIDProperty(options)) {
            arr = this.reArrangeEntries(arr);
          }

          // z-prune and trim results
          arr = this.trimEntryObjArray(
            Dictionary.zPropPrune(arr, options.z), options
          );

          cb(err, {items: arr});
        }
      });
    }
  }

  getEntryMatchesForString(str, options, cb) {
    if (!str) return cb(null, {items: []});

    const urlArray = this.buildMatchURLs(str, options);
    let callsRemaining = urlArray.length;
    let urlToResultsMap = new Map();

    for (let url of urlArray) {
      if (this.enableLogging)
        console.log('URL: ' + url);

      urlToResultsMap.set(url, []);

      this.request(url, (err, res) => {
        if (err) return cb(err);

        if (url.includes('/property_search'))
          urlToResultsMap.set(
            url, this.mapBioPortalPropertySearchResToMatchObj(res, str)
          );
        else
          urlToResultsMap.set(
            url, this.mapBioPortalSearchResToMatchObj(res, str)
          );

        --callsRemaining;
        // all calls have returned, so merge, prune, sort and trim results
        if (callsRemaining <= 0) {
          urlToResultsMap = this.pruneCommonResultsById(urlToResultsMap);

          // merge results when there are 2 or 4 URLs (group them as
          // 'preferred' vs 'rest' ontologies - no matter if they come
          // from a `/search` or a `/property_search` endpoint query)
          let mergedMatchObjArrays = Array.from(urlToResultsMap.values());
          if (urlToResultsMap.size === 2) {
            mergedMatchObjArrays = [
              mergedMatchObjArrays[0].concat(mergedMatchObjArrays[1])
            ];
          } else if (urlToResultsMap.size === 4) {
            // 'preferred' results
            let preferredOntologyRes = mergedMatchObjArrays[0]
              .concat(mergedMatchObjArrays[1]);
            let restOntologyRes      = mergedMatchObjArrays[2]
              .concat(mergedMatchObjArrays[3]);
            mergedMatchObjArrays = [preferredOntologyRes, restOntologyRes];
          } // size == 1 (do nothing)

          // gather all results in one array, sort and z-prune them
          let arr = [];
          for (let matchObjArray of mergedMatchObjArrays) {
            arr = arr.concat(this.sortMatches(
              Dictionary.zPropPrune(matchObjArray, options.z))
            );
          }

          arr = this.trimMatchObjArray(arr, options);

          cb(err, {items: arr});
        }
      });
    }
  }

  buildDictInfoURLs(options) {
    let idList = [];

    // remove empty space ids
    if (hasProperFilterIDProperty(options)) {
      idList = options.filter.id.filter(id => id.trim() !== '');
    }

    if (idList.length !== 0) {
      // specific IDs
      return idList.map(dictID =>
        this.prepareDictInfoSearchURL(getLastPartOfURL(dictID)));
    } else {
      // all IDs
      return [this.prepareDictInfoSearchURL()];
    }
  }

  buildEntryURLs(options) {
    if (
      !hasProperFilterIDProperty(options)
      && !hasProperFilterDictIDProperty(options)
    ) {
      return this.prepareEntrySearchURLs(options, '', []);
    } else if (
      !hasProperFilterIDProperty(options)
      && hasProperFilterDictIDProperty(options)
    ) {
      const ontologiesArray =
        this.getDictAcronymsFromArray(options.filter.dictID);
      return this.prepareEntrySearchURLs(options, '', ontologiesArray);
    } else if (
      hasProperFilterIDProperty(options)
      && !hasProperFilterDictIDProperty(options)
    ) {
      let urlArray = [];
      for (let entryId of options.filter.id) {
        urlArray = urlArray.concat(
          this.prepareEntrySearchURLs(options, entryId, [])
        );
      }
      return urlArray;
    } else { // both proper `filter.id` and `filter.dictID`
      const ontologiesArray =
        this.getDictAcronymsFromArray(options.filter.dictID);

      let urlArray = [];
      for (let entryId of options.filter.id) {
        urlArray = urlArray.concat(
          this.prepareEntrySearchURLs(options, entryId, ontologiesArray)
        );
      }
      return urlArray;
    }
  }

  buildMatchURLs(str, options) {
    const obj = this.splitDicts(options);
    const pref = this.getDictAcronymsFromArray(obj.pref);
    const rest = this.getDictAcronymsFromArray(obj.rest);

    if (pref.length === 0 && rest.length === 0)
      return this.prepareMatchStringSearchURL(str, options, []);
    else if (pref.length === 0 && rest.length !== 0)
      return this.prepareMatchStringSearchURL(str, options, rest);
    else if (pref.length !== 0 && rest.length === 0) {
      if (
        !options.hasOwnProperty('page')
        || hasPagePropertyEqualToOne(options)
      )
        return this.prepareMatchStringSearchURL(str, options, pref)
          .concat(this.prepareMatchStringSearchURL(str, options, []));
      else return this.prepareMatchStringSearchURL(str, options, []);
    } else if (pref.length !== 0 && rest.length !== 0) {
      if (
        !options.hasOwnProperty('page')
        || hasPagePropertyEqualToOne(options)
      )
        return this.prepareMatchStringSearchURL(str, options, pref)
          .concat(this.prepareMatchStringSearchURL(str, options, rest));
      else
        return this.prepareMatchStringSearchURL(str, options, pref.concat(rest));
    }
  }

  splitDicts(options) {
    if (!hasProperSortDictIDProperty(options))
      return ({
        pref: [],
        rest: hasProperFilterDictIDProperty(options)
          ? options.filter.dictID
          : []
      });
    else if (hasProperFilterDictIDProperty(options)) {
      if (options.filter.dictID.every(
        dictID => options.sort.dictID.includes(dictID)))
        return {
          pref: [],
          rest: options.filter.dictID
        };
      else {
        return {
          pref: options.sort.dictID.reduce((res, dictID) => {
            if (options.filter.dictID.includes(dictID))
              res.push(dictID);
            return res;
          }, []),
          rest: options.filter.dictID.reduce((res, dictID) => {
            if (!options.sort.dictID.includes(dictID))
              res.push(dictID);
            return res;
          }, [])
        };
      }
    } else return ({
      pref: options.sort.dictID,
      rest: []
    });
  }

  mapBioPortalResToDictInfoObj(res) {
    if (Array.isArray(res)) {
      // case of all ontologies in BioPortal
      return res.map(entry => ({
        id: entry['@id'],
        abbrev: entry.acronym,
        name: entry.name
      }));
    } else {
      // case of a specific ontology
      return [
        {
          id: res['@id'],
          abbrev: res.acronym,
          name: res.name
        }
      ];
    }
  }

  mapBioPortalSearchResToEntryObj(res, options) {
    return res.collection.map(entry => ({
      id: entry['@id'],
      dictID: entry.links.ontology,
      ...((typeof entry.definition !== 'undefined')
        && {
          descr: entry.definition[0] // take just the first definition
        }),
      terms: this.getTermsFromSearch(entry.prefLabel, entry.synonym),
      z: {
        dictAbbrev: getLastPartOfURL(entry.links.ontology),
        ...((typeof entry.cui !== 'undefined')
          && {
            cui: entry.cui // Concept Unique Identifiers
          }),
        ...((typeof entry.semanticType !== 'undefined')
          && {
            tui: entry.semanticType // Type Unique Identifiers
          }),
        // `z.obsolete` is added only when requesting for a specific entry id
        ...((hasProperFilterIDProperty(options))
          && {
            obsolete: entry.obsolete
          })
      }
    }));
  }

  mapBioPortalSearchResToMatchObj(res, str) {
    return res.collection.map(entry => ({
      id: entry['@id'],
      dictID: entry.links.ontology,
      str: entry.prefLabel,
      ...((typeof entry.definition !== 'undefined')
        && {
          descr: entry.definition[0] // take just the first definition
        }),
      type: entry.prefLabel.startsWith(str) ? 'S' : 'T',
      terms: this.getTermsFromSearch(entry.prefLabel, entry.synonym),
      z: {
        dictAbbrev: getLastPartOfURL(entry.links.ontology),
        ...((typeof entry.cui !== 'undefined')
          && {
            cui: entry.cui // Concept Unique Identifiers
          }),
        ...((typeof entry.semanticType !== 'undefined')
          && {
            tui: entry.semanticType // Type Unique Identifiers
          })
      }
    }));
  }

  mapBioPortalPropertySearchResToEntryObj(res) {
    return res.collection.map(entry => ({
      id: entry['@id'],
      dictID: entry.links.ontology,
      ...((typeof entry.definition !== 'undefined')
        && {
          descr: entry.definition[0] // take just the first definition
        }),
      terms: this.getTermsFromPropertySearch(entry.label, entry.labelGenerated),
      z: {
        dictAbbrev: getLastPartOfURL(entry.links.ontology)
      }
    }));
  }

  mapBioPortalPropertySearchResToMatchObj(res, str) {
    return res.collection.map(entry => ({
      id: entry['@id'],
      dictID: entry.links.ontology,
      str: this.getStr(entry.label, entry.labelGenerated),
      ...((typeof entry.definition !== 'undefined')
        && {
          descr: entry.definition[0] // take just the first definition
        }),
      type: this.getType(entry.label, entry.labelGenerated, str),
      terms: this.getTermsFromPropertySearch(entry.label, entry.labelGenerated),
      z: {
        dictAbbrev: getLastPartOfURL(entry.links.ontology)
      }
    }));
  }

  getDictAcronymsFromArray(arr) {
    if (arr.length === 0) return arr;
    return arr.map(dictID => getLastPartOfURL(dictID));
  }

  getStr(labelArr, labelGeneratedArr) {
    return (typeof (labelArr) !== 'undefined')
      ? labelArr[0]
      : labelGeneratedArr[0];
  }

  getType(labelArr, labelGeneratedArr, str) {
    return (typeof (labelArr) !== 'undefined')
      ? labelArr[0].startsWith(str) ? 'S' : 'T'
      : labelGeneratedArr[0].startsWith(str) ? 'S' : 'T';
  }

  getTermsFromPropertySearch(labelArr, labelGeneratedArr) {
    return (typeof (labelArr) !== 'undefined')
      ? labelArr.map(label => ({ str: label }))
      : labelGeneratedArr.map(label => ({ str: label }));
  }

  getTermsFromSearch(mainTerm, synonyms) {
    if (typeof synonyms === 'undefined')
      return [{str: mainTerm}];
    else {
      const terms = [{str: mainTerm}];
      for (let synonym of synonyms) {
        if (synonym !== mainTerm) {
          terms.push({str: synonym});
        }
      }
      return terms;
    }
  }

  prepareDictInfoSearchURL(ontologyAcronym) {
    let url = this.urlGetDictInfos;

    if (ontologyAcronym)
      url += ontologyAcronym;

    url += '?' + this.noContextField;
    return url;
  }

  prepareEntrySearchURLs(options, searchId, ontologiesArray) {
    let searchURL = this.urlGetEntries;
    let propertySearchURL = this.urlGetEntriesFromProperties;

    if (searchId === '') {
      searchURL = searchURL.replace('q=$idString', '')
        .replace('&ontologies=', 'ontologies=') + '&ontology_types=ONTOLOGY';
    } else {
      searchURL = searchURL.replace('$idString', fixedEncodeURIComponent(searchId))
        + '&require_exact_match=true&also_search_obsolete=true';
      propertySearchURL = propertySearchURL.replace('$idString', fixedEncodeURIComponent(searchId))
        + '&require_exact_match=true';
    }

    searchURL = (ontologiesArray.length !== 0)
      ? searchURL.replace('$dictIDs', ontologiesArray.toString())
      : searchURL.replace('$dictIDs', '');

    propertySearchURL = (ontologiesArray.length !== 0)
      ? propertySearchURL.replace('$dictIDs', ontologiesArray.toString())
      : propertySearchURL.replace('$dictIDs', '');

    if (hasProperPageProperty(options)) {
      const pageNumber = options.page;
      searchURL += '&page=' + pageNumber;
      propertySearchURL += '&page=' + pageNumber;
    }

    if (hasProperPerPageProperty(options)) {
      const NumOfResultsPerPage = options.perPage;
      searchURL += '&pagesize=' + NumOfResultsPerPage;
      propertySearchURL += '&pagesize=' + NumOfResultsPerPage;
    }

    searchURL += '&' + this.noContextField;
    propertySearchURL += '&' + this.noContextField;

    return searchId === ''
      ? [searchURL]
      : [searchURL, propertySearchURL];
  }

  prepareMatchStringSearchURL(str, options, ontologiesArray) {
    let searchURL = this.urlGetMatches
      .replace('$queryString', fixedEncodeURIComponent(str));
    let propertySearchURL = this.urlGetMatchesFromProperties
      .replace('$queryString', fixedEncodeURIComponent(str));

    if (ontologiesArray.length !== 0) {
      searchURL += '&ontologies=' + ontologiesArray.toString();
      propertySearchURL += '&ontologies=' + ontologiesArray.toString();
    }

    if (hasProperPageProperty(options)) {
      let pageNumber = options.page;
      searchURL += '&page=' + pageNumber;
      propertySearchURL += '&page=' + pageNumber;
    }

    if (hasProperPerPageProperty(options)) {
      let NumOfResultsPerPage = options.perPage;
      searchURL += '&pagesize=' + NumOfResultsPerPage;
      propertySearchURL += '&pagesize=' + NumOfResultsPerPage;
    }

    searchURL += '&' + this.noContextField;
    propertySearchURL += '&' + this.noContextField;

    return [searchURL, propertySearchURL];
  }

  request(url, cb) {
    const req = this.getReqObj();
    req.onreadystatechange = function () {
      if (req.readyState === 4) {
        if (req.status !== 200) {
          isJSONString(req.responseText)
            ? cb(JSON.parse(req.responseText))
            : cb(JSON.parse('{ "status": ' + req.status
              + ', "errors": [' + JSON.stringify(req.responseText) + ']}'));
        }
        else {
          try {
            const response = JSON.parse(req.responseText);
            cb(null, response);
          } catch (err) {
            cb(err);
          }
        }
      }
    };
    req.open('GET', url, true);
    req.setRequestHeader('Authorization', 'apikey token=' + this.key);
    req.send();
  }

  getReqObj() {
    return new (typeof XMLHttpRequest !== 'undefined'
      ? XMLHttpRequest // In browser
      : require('xmlhttprequest').XMLHttpRequest  // In Node.js
    )();
  }

  /** Check the case where you have 4 URLs, corresponding
   *  to cases where options.sort was defined but not
   *  options.filter or both were sufficiently defined to
   *  partition between preferred dictionaries (1st & 2nd URL)
   *  and the rest (3rd & 4rd URL). Such cases may have common
   *  results when comparing 1st and 3rd URL (`/search` endpoint)
   *  and 2nd and 4th (`/property_search` endpoint) which we
   *  prune. Pruning is done based on common `id` property and
   *  it results in fewer results in the 3rd and 4th VSM match
   *  Object arrays)
   */
  pruneCommonResultsById(map) {
    if (map.size === 4) {
      const urls = Array.from(map.keys());

      const firstURL  = urls[0];
      const secondURL = urls[1];
      const thirdURL  = urls[2];
      const fourthURL = urls[3];

      let matchObjArray1 = map.get(firstURL);
      let matchObjArray2 = map.get(secondURL);
      let matchObjArray3 = map.get(thirdURL);
      let matchObjArray4 = map.get(fourthURL);

      const ids1 = this.getIDsFromMatchObjArray(matchObjArray1);
      const ids2 = this.getIDsFromMatchObjArray(matchObjArray2);

      matchObjArray3 = matchObjArray3.filter(matchObj => {
        if (!ids1.includes(matchObj.id)) {
          return matchObj;
        }
      });
      map.set(thirdURL, matchObjArray3);

      matchObjArray4 = matchObjArray4.filter(matchObj => {
        if (!ids2.includes(matchObj.id)) {
          return matchObj;
        }
      });
      map.set(fourthURL, matchObjArray4);
    }
    return map;
  }

  getIDsFromEntryObjArray(arr) {
    return this.getIDsFromMatchObjArray(arr);
  }

  getIDsFromMatchObjArray(arr) {
    return arr.reduce((res, matchObj) => {
      if (matchObj.id && !res.includes(matchObj.id))
        res.push(matchObj.id);
      return res;
    }, []);
  }

  queryForExactId(url) {
    // the next URL parameter is used when querying for an entry by `id`
    const exactMatchStr = '&require_exact_match=true';
    return url.includes(exactMatchStr);
  }

  sortEntries(arr, options) {
    if (!hasProperEntrySortProperty(options) || options.sort === 'dictID')
      return arr.sort((a, b) =>
        str_cmp(a.dictID, b.dictID)
        || str_cmp(a.id, b.id));
    else if (options.sort === 'id')
      return arr.sort((a, b) =>
        str_cmp(a.id, b.id));
    else if (options.sort === 'str')
      return arr.sort((a, b) =>
        str_cmp(a.terms[0].str, b.terms[0].str)
        || str_cmp(a.dictID, b.dictID)
        || str_cmp(a.id, b.id));
  }

  sortMatches(arr) {
    return arr.sort((a, b) =>
      str_cmp(a.type, b.type)
      || str_cmp(a.str, b.str)
      || str_cmp(a.dictID, b.dictID));
  }

  getPage(options) {
    return hasProperPageProperty(options)
      ? options.page
      : this.bioPortalDefaultPage;
  }

  getPageSize(options) {
    return hasProperPerPageProperty(options)
      ? options.perPage
      : this.bioPortalDefaultPageSize;
  }

  /** Before using this function check that the
   * `options.filter.id` is properly defined with
   *  `hasProperFilterIDProperty`
   */
  hijackPageSize(options) {
    const dictIDNum = (hasProperFilterDictIDProperty(options))
      ? options.filter.dictID.length
      : false;

    if (dictIDNum) {
      return Math.min(dictIDNum, this.bioPortalMaximumPageSize);
    } else {
      return this.bioPortalMaximumOntologiesNumWithSameID;
    }
  }

  trimDictInfoArray(arr, page, pagesize) {
    const numberOfResults = arr.length;
    if (page === 1) {
      return arr.slice(0, Math.min(numberOfResults, pagesize));
    } else {
      return arr.slice(
        ((page - 1) * pagesize),
        Math.min(page * pagesize, numberOfResults)
      );
    }
  }

  trimEntryObjArray(arr, options) {
    // do not trim when getAllResults hack is enabled
    return (options.getAllResults)
      ? arr
      : this.trimMatchObjArray(arr, options);
  }

  trimMatchObjArray(arr, options) {
    if (hasProperPerPageProperty(options)) {
      return arr.slice(0, options.perPage);
    } else {
      return arr.slice(0, this.bioPortalDefaultPageSize);
    }
  }

  reArrangeEntries(entryArray) {
    const uniqueIDs = this.getIDsFromEntryObjArray(entryArray);

    let position = 0;
    for (let id of uniqueIDs) {
      let dictAbbrevInferred = this.inferDictAbbrevFromId(id);
      let index = entryArray.findIndex(entry =>
        (entry.id === id && entry.z.dictAbbrev === dictAbbrevInferred)
      );

      // if the inferred dictAbbrev was empty or wrongly inferred,
      // return the index of the first entry that matches the id
      if (index === -1) {
        index = entryArray.findIndex(entry => entry.id === id);
      }
      let entry = entryArray[index];

      if (index !== position) {
        // remove entry from entryArray
        entryArray.splice(index, 1);

        // insert it at next position (keeping the initial order)
        entryArray.splice(position, 0, entry);
      }

      position++;
    }

    return entryArray;
  }

  inferDictAbbrevFromId(id) {
    // TODO add more regexes!
    const ontologyRegexes = [
      /ontology\/(.*?)\//g, /obo\/(.*?)_/g, /www\.orpha\.net\/(.*?)\//g,
      /efo\/(.*?)_/g
    ];

    const inferredDictAbbrevs = ontologyRegexes.reduce((res, regex) => {
      const match = regex.exec(id);
      if (match) res.push(match[1]);
      return res;
    }, []);

    // return first match dictID if one exists
    return (inferredDictAbbrevs.length === 0) ? '' : inferredDictAbbrevs[0];
  }
};
