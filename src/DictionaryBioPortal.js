const Dictionary = require('vsm-dictionary');

module.exports = class DictionaryBioPortal extends Dictionary {

  constructor(options) {
    const opt = options || {};
    super(opt);

    const baseUrl = opt.baseUrl || 'http://data.bioontology.org';

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

    this.urlGetDictInfos = opt.urlGetDictInfos || baseUrl + '/ontologies/';
    this.urlGetEntries = opt.urlGetEntries ||
      baseUrl + '/search?q=$idString' + '&ontologies=$dictIDs';
    this.urlGetMatches = opt.urlGetMatches || baseUrl + '/search?q=$queryString';
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

    for (let url of urlArray) {
      if (this.enableLogging)
        console.log('URL: ' + url);

      urlToResultsMap.set(url, []);

      this.request(url, (err, res) => {
        if (err) return cb(err);
        urlToResultsMap.set(url, this.mapBioPortalResToDictInfoObj(res));

        --callsRemaining;
        // all calls have returned, so trim results
        if (callsRemaining <= 0) {
          // gather all results in one array
          let arr = [];
          for (let dictInfoObjArray of urlToResultsMap.values())
            arr = arr.concat(dictInfoObjArray);

          arr = this.trimDictInfoArray(arr, page, pagesize);

          cb(err, {items: arr});
        }
      });
    }
  }

  getEntries(options, cb) {
    // Hack option for getting proper sorted results from BioPortal
    // when requesting for an entry by id (with or without dictID)
    options.getAllResults = options.getAllResults || false;

    if ((options.getAllResults) && this.hasProperFilterIDProperty(options)) {
      options.page = 1;
      options.perPage = this.hijackPageSize(options);
      console.log('Hijacking options: page = ' + options.page +
        ', perPage = ' + options.perPage);
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
        urlToResultsMap.set(url, this.mapBioPortalResToEntryObj(res, options));

        --callsRemaining;
        // all calls have returned, so sort and trim results
        if (callsRemaining <= 0) {
          // gather all results in one array
          let arr = [];
          for (let entryObjArray of urlToResultsMap.values())
            arr = arr.concat(entryObjArray);

          // Sort only if the request was for specific id(s)
          // and getAllResults hack is enabled
          if ((options.getAllResults) &&
            this.hasProperFilterIDProperty(options)) {
            console.log('Sorting in client...');
            arr = this.sortEntries(arr, options);
          }

          // re-arrange if possible the returned results when requesting
          // entries by id, in case that some of them share the same id
          if (this.hasProperFilterIDProperty(options)) {
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
        urlToResultsMap.set(url, this.mapBioPortalResToMatchObj(res, str));

        --callsRemaining;
        // all calls have returned, so prune, sort and trim results
        if (callsRemaining <= 0) {
          urlToResultsMap = this.pruneCommonResultsById(urlToResultsMap);

          // gather all results in one array, sort and z-prune them
          let arr = [];
          for (let matchObjArray of urlToResultsMap.values()) {
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
    if (this.hasProperFilterIDProperty(options)) {
      return options.filter.id.map(dictID =>
        this.prepareDictInfoSearchURL(this.getDictAcronym(dictID)));
    } else return [this.prepareDictInfoSearchURL()];
  }

  buildEntryURLs(options) {
    if (!this.hasProperFilterIDProperty(options) &&
      !this.hasProperFilterDictIDProperty(options)) {
      return [this.prepareEntrySearchURL(options, '', [])];
    } else if (!this.hasProperFilterIDProperty(options) &&
      this.hasProperFilterDictIDProperty(options)) {
      const ontologiesArray =
        this.getDictAcronymsFromArray(options.filter.dictID);
      return [this.prepareEntrySearchURL(options, '', ontologiesArray)];
    } else if (this.hasProperFilterIDProperty(options) &&
      !this.hasProperFilterDictIDProperty(options)) {
      return options.filter.id.map(entryId =>
        this.prepareEntrySearchURL(options, entryId, []));
    } else { // both proper `filter.id` and `filter.dictID`
      const ontologiesArray =
        this.getDictAcronymsFromArray(options.filter.dictID);
      return options.filter.id.map(entryId =>
        this.prepareEntrySearchURL(options, entryId, ontologiesArray)
      );
    }
  }

  buildMatchURLs(str, options) {
    const obj = this.splitDicts(options);
    const pref = this.getDictAcronymsFromArray(obj.pref);
    const rest = this.getDictAcronymsFromArray(obj.rest);

    if (pref.length === 0 && rest.length === 0)
      return [this.prepareMatchStringSearchURL(str, options, [])];
    else if (pref.length === 0 && rest.length !== 0)
      return [this.prepareMatchStringSearchURL(str, options, rest)];
    else if (pref.length !== 0 && rest.length === 0) {
      if (!options.hasOwnProperty('page') ||
        this.hasPagePropertyEqualToOne(options))
        return [this.prepareMatchStringSearchURL(str, options, pref)]
          .concat([this.prepareMatchStringSearchURL(str, options, [])]);
      else return [this.prepareMatchStringSearchURL(str, options, [])];
    } else if (pref.length !== 0 && rest.length !== 0) {
      if (!options.hasOwnProperty('page') ||
        this.hasPagePropertyEqualToOne(options))
        return [this.prepareMatchStringSearchURL(str, options, pref)]
          .concat([this.prepareMatchStringSearchURL(str, options, rest)]);
      else return [
        this.prepareMatchStringSearchURL(str, options, pref.concat(rest))
      ];
    }
  }

  splitDicts(options) {
    if (!this.hasProperSortDictIDProperty(options))
      return ({
        pref: [],
        rest: this.hasProperFilterDictIDProperty(options) ?
          options.filter.dictID : []
      });
    else if (this.hasProperFilterDictIDProperty(options)) {
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

  mapBioPortalResToEntryObj(res, options) {
    return res.collection.map(entry => ({
      id: entry['@id'],
      dictID: entry.links.ontology,
      ...((typeof entry.definition !== 'undefined') &&
        {
          descr: entry.definition[0] // take just the first definition
        }),
      terms: this.getTerms(entry.prefLabel, entry.synonym),
      z: {
        dictAbbrev: entry.links.ontology.split('/').pop(),
        ...((typeof entry.cui !== 'undefined') &&
          {
            cui: entry.cui // Concept Unique Identifiers
          }),
        ...((typeof entry.semanticType !== 'undefined') &&
          {
            tui: entry.semanticType // Type Unique Identifiers
          }),
        // `z.obsolete` is added only when requesting for specific entry id
        ...((this.hasProperFilterIDProperty(options)) &&
          {
            obsolete: entry.obsolete
          })
      }
    }));
  }

  mapBioPortalResToMatchObj(res, str) {
    return res.collection.map(entry => ({
      id: entry['@id'],
      dictID: entry.links.ontology,
      str: entry.prefLabel,
      ...((typeof entry.definition !== 'undefined') &&
        {
          descr: entry.definition[0] // take just the first definition
        }),
      type: entry.prefLabel.startsWith(str) ? 'S' : 'T',
      terms: this.getTerms(entry.prefLabel, entry.synonym),
      z: {
        dictAbbrev: entry.links.ontology.split('/').pop(),
        ...((typeof entry.cui !== 'undefined') &&
          {
            cui: entry.cui // Concept Unique Identifiers
          }),
        ...((typeof entry.semanticType !== 'undefined') &&
          {
            tui: entry.semanticType // Type Unique Identifiers
          })
      }
    }));
  }

  getDictAcronymsFromArray(arr) {
    if (arr.length === 0) return arr;
    return arr.map(dictID => this.getDictAcronym(dictID));
  }

  getDictAcronym(dictID) {
    return dictID.split('/').pop();
  }

  prepareDictInfoSearchURL(ontologyAcronym) {
    let url = this.urlGetDictInfos;

    if (ontologyAcronym)
      url += ontologyAcronym;

    url += '?' + this.noContextField;
    return url;
  }

  prepareEntrySearchURL(options, searchId, ontologiesArray) {
    let url = this.urlGetEntries;

    if (searchId === '') {
      url = url.replace('q=$idString', '')
        .replace('&ontologies=', 'ontologies=') + '&ontology_types=ONTOLOGY';
    } else {
      url = url.replace('$idString', this.fixedEncodeURIComponent(searchId)) +
        '&require_exact_match=true&also_search_obsolete=true';
    }

    url = (ontologiesArray.length !== 0) ?
      url.replace('$dictIDs', ontologiesArray.toString()) :
      url.replace('$dictIDs', '');

    if (this.hasProperPageProperty(options)) {
      const pageNumber = options.page;
      url += '&page=' + pageNumber;
    }

    if (this.hasProperPerPageProperty(options)) {
      const NumOfResultsPerPage = options.perPage;
      url += '&pagesize=' + NumOfResultsPerPage;
    }

    url += '&' + this.noContextField;
    return url;
  }

  prepareMatchStringSearchURL(str, options, ontologiesArray) {
    let url = this.urlGetMatches
      .replace('$queryString', this.fixedEncodeURIComponent(str));

    if (ontologiesArray.length !== 0)
      url += '&ontologies=' + ontologiesArray.toString();

    if (this.hasProperPageProperty(options)) {
      let pageNumber = options.page;
      url += '&page=' + pageNumber;
    }

    if (this.hasProperPerPageProperty(options)) {
      let NumOfResultsPerPage = options.perPage;
      url += '&pagesize=' + NumOfResultsPerPage;
    }

    url += '&' + this.noContextField;
    return url;
  }

  getTerms(mainTerm, synonyms) {
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

  request(url, cb) {
    const req = this.getReqObj();
    req.onreadystatechange = function () {
      if (req.readyState === 4) {
        if (req.status !== 200)
          cb(JSON.parse(req.responseText));
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
    return new (typeof XMLHttpRequest !== 'undefined' ?
      XMLHttpRequest :  // In browser
      require('xmlhttprequest').XMLHttpRequest  // In Node.js
    )();
  }

  /** Check the case where you have two URLs, corresponding
   *  to cases where options.sort was defined but not
   *  options.filter or both were sufficiently defined to
   *  partition between preferred dictionaries (1st URL) and
   *  the rest (2nd URL). Such cases may have common results
   *  which we prune (pruning is done based on common `id` property)
   */
  pruneCommonResultsById(map) {
    if (map.size === 2) {
      const urls = Array.from(map.keys());
      const firstURL = urls[0];
      const secondURL = urls[1];
      let matchObjArray1 = map.get(firstURL);
      let matchObjArray2 = map.get(secondURL);
      const ids1 = this.getIDsFromMatchObjArray(matchObjArray1);

      matchObjArray2 = matchObjArray2.filter(matchObj => {
        if (!ids1.includes(matchObj.id)) {
          return matchObj;
        }
      });
      map.set(secondURL, matchObjArray2);
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
    if (!this.hasProperEntrySortProperty(options) || options.sort === 'dictID')
      return arr.sort((a, b) =>
        this.str_cmp(a.dictID, b.dictID) ||
        this.str_cmp(a.id, b.id));
    else if (options.sort === 'id')
      return arr.sort((a, b) =>
        this.str_cmp(a.id, b.id));
    else if (options.sort === 'str')
      return arr.sort((a, b) =>
        this.str_cmp(a.terms[0].str, b.terms[0].str) ||
        this.str_cmp(a.dictID, b.dictID) ||
        this.str_cmp(a.id, b.id));
  }

  sortMatches(arr) {
    return arr.sort((a, b) =>
      this.str_cmp(a.type, b.type) ||
      this.str_cmp(a.str, b.str) ||
      this.str_cmp(a.dictID, b.dictID));
  }

  str_cmp(a, b, caseMatters = false) {
    if (!caseMatters) {
      a = a.toLowerCase();
      b = b.toLowerCase();
    }
    return a < b ? -1 : a > b ? 1 : 0;
  }

  getPage(options) {
    return this.hasProperPageProperty(options) ?
      options.page : this.bioPortalDefaultPage;
  }

  getPageSize(options) {
    return this.hasProperPerPageProperty(options) ?
      options.perPage : this.bioPortalDefaultPageSize;
  }

  /** Before using this function check that the
   * `options.filter.id` is properly defined with
   *  `this.hasProperFilterIDProperty`
   */
  hijackPageSize(options) {
    const dictIDNum = (this.hasProperFilterDictIDProperty(options)) ?
      options.filter.dictID.length : false;

    if (dictIDNum) {
      return Math.min(dictIDNum, this.bioPortalMaximumPageSize);
    } else {
      return this.bioPortalMaximumOntologiesNumWithSameID;
    }
  }

  hasProperFilterDictIDProperty(options) {
    return options.hasOwnProperty('filter') &&
      options.filter.hasOwnProperty('dictID') &&
      Array.isArray(options.filter.dictID) &&
      options.filter.dictID.length !== 0;
  }

  hasProperFilterIDProperty(options) {
    return options.hasOwnProperty('filter') &&
      options.filter.hasOwnProperty('id') &&
      Array.isArray(options.filter.id) &&
      options.filter.id.length !== 0;
  }

  hasProperSortDictIDProperty(options) {
    return options.hasOwnProperty('sort') &&
      options.sort.hasOwnProperty('dictID') &&
      Array.isArray(options.sort.dictID) &&
      options.sort.dictID.length !== 0;
  }

  hasProperPageProperty(options) {
    return options.hasOwnProperty('page') &&
      Number.isInteger(options.page) &&
      options.page >= 1;
  }

  hasPagePropertyEqualToOne(options) {
    return options.hasOwnProperty('page') &&
      Number.isInteger(options.page) &&
      options.page === 1;
  }

  hasProperPerPageProperty(options) {
    return options.hasOwnProperty('perPage') &&
      Number.isInteger(options.perPage) &&
      options.perPage >= 1;
  }

  hasProperEntrySortProperty(options) {
    return options.hasOwnProperty('sort') &&
      typeof options.sort === 'string' &&
      (options.sort === 'dictID' ||
        options.sort === 'id' || options.sort === 'str');
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
    return (options.getAllResults) ? arr :
      this.trimMatchObjArray(arr, options);
  }

  trimMatchObjArray(arr, options) {
    if (this.hasProperPerPageProperty(options)) {
      return arr.slice(0, options.perPage);
    } else {
      return arr.slice(0, this.bioPortalDefaultPageSize);
    }
  }

  fixedEncodeURIComponent(str) {
    // encode also characters: !, ', (, ), and *
    return encodeURIComponent(str).replace(/[!'()*]/g, c =>
      '%' + c.charCodeAt(0).toString(16).toUpperCase());
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
