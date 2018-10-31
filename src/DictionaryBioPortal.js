const Dictionary = require('vsm-dictionary');

module.exports = class DictionaryBioPortal extends Dictionary {

  constructor(options) {
    var opt = options || {};
    super(opt);

    var baseUrl = opt.baseUrl || 'http://data.bioontology.org';
    // an API key must provided to get data from BioPortal
    this.key = opt.apiKey || {};
    // no context-related info is needed for matching to VSM terms
    this.noContextField = '&display_context=false';

    /*this.urlGetDictInfos = opt.urlGetDictInfos ||
			baseUrl + '/dic?id=$filterID&name=$filterName&sort=$sort' + pp;
	this.urlGetEntries   = opt.urlGetEntries   ||
			baseUrl + '/ent?id=$filterID&dictID=$filterDictID&z=$z&sort=$sort'+ pp;*/

    this.urlGetMatches   = opt.urlGetMatches   ||
			baseUrl + '/search?q=$queryString';
  }

  /*getDictInfos(options, cb) {
    var o = this._prepGetOptions(options, ['id', 'name']);
    var url = this.urlGetDictInfos
      .replace('$filterID'  , o.filter.id  .join(','));
    this.request(url, (err, arr) => cb(err, { items: arr }));
  }*/

  /*getEntries(options, cb) {
    var o = this._prepGetOptions(options, ['id', 'dictID']);
    var url = this.urlGetEntries
      .replace('$filterID'    , o.filter.id    .join(','));
    this.request(url, (err, arr) => cb(err, { items: arr }));
  }*/

  getEntryMatchesForString(str, options, cb) {
    if (!str) return cb(null, { items: [] });

    var urlArray = this.buildURLs(str, options);
    var callsRemaining = urlArray.length;
    var urlToResultsMap = new Map();

    for (let url of urlArray) {
      console.log('URL: ' + url);
      urlToResultsMap.set(url, []);

      this.request(url, (err, res) => {
        if (err) return cb(err);
        urlToResultsMap.set(url, this.processBioPortalResponse(res, str));

        --callsRemaining;
        /** all calls have returned, so prune, sort and trim results */
        if (callsRemaining <= 0) {
          urlToResultsMap = this.pruneCommonResults(urlToResultsMap);

          var arr = [];
          for (var matchObjArray of urlToResultsMap.values()) {
            arr = arr.concat(this.sortWithoutPreferredDict(
              Dictionary.zPropPrune(matchObjArray, options.z))
            );
          }

          if (this.hasProperPerPageProperty(options)) {
            arr = arr.splice(0, options.perPage);
          } else {
            arr = arr.splice(0, 50); // BioPortal's API default pagesize value
          }

          cb(err, { items: arr });
        }
      });
    }
  }

  buildURLs(str, options) {
    var obj = this.splitDicts(options);
    var pref = this.getDictAbbrev(obj.pref);
    var rest = this.getDictAbbrev(obj.rest);

    if (pref.length === 0 && rest.length === 0)
      return [this.prepareURLString(str, options, [])];
    else if (pref.length === 0 && rest.length !== 0)
      return [this.prepareURLString(str, options, rest)];
    else if (pref.length !== 0 && rest.length === 0) {
      if (!options.hasOwnProperty('page') ||
        this.hasPagePropertyEqualToOne(options))
        return [this.prepareURLString(str, options, pref)].
          concat([this.prepareURLString(str, options, [])]);
      else return [this.prepareURLString(str, options, [])];
    } else if (pref.length !== 0 && rest.length !== 0) {
      if (!options.hasOwnProperty('page') ||
        this.hasPagePropertyEqualToOne(options))
        return [this.prepareURLString(str, options, pref)].
          concat([this.prepareURLString(str, options, rest)]);
      else return [this.prepareURLString(str, options, pref.concat(rest))];
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
        dictid => options.sort.dictID.includes(dictid)))
        return {
          pref: [],
          rest: options.filter.dictID
        };
      else {
        return {
          pref: options.sort.dictID.reduce((res, dictid) => {
            if (options.filter.dictID.includes(dictid))
              res.push(dictid);
            return res;
          }, []),
          rest: options.filter.dictID.reduce((res, dictid) => {
            if (!options.sort.dictID.includes(dictid))
              res.push(dictid);
            return res;
          }, [])
        };
      }
    } else return ({
      pref: options.sort.dictID,
      rest: []
    });
  }

  getDictAbbrev(arr) {
    if (arr.length === 0) return arr;
    return arr.map(dictid => dictid.split('/').pop());
  }

  prepareURLString(str, options, ontologiesArray) {
    var url = this.urlGetMatches
      .replace('$queryString', encodeURIComponent(str));

    if (ontologiesArray.length !== 0)
      url += '&ontologies=' + ontologiesArray.toString();

    if (this.hasProperPageProperty(options)) {
      var pageNumber = options.page;
      url += '&page=' + pageNumber;
    }

    if (this.hasProperPerPageProperty(options)) {
      var NumOfResultsPerPage = options.perPage;
      url += '&pagesize=' + NumOfResultsPerPage;
    }

    url += this.noContextField;
    return url;
  }

  processBioPortalResponse(res, str) {
    return res.collection.map(entry => ({
      id: entry['@id'],
      dictID: entry.links.ontology,
      str: entry.prefLabel,
      ...((entry.definition !== undefined) &&
        {
          descr: entry.definition[0] // take just the first definition
        }),
      type: entry.prefLabel.startsWith(str) ? 'S' : 'T',
      ...((entry.synonym !== undefined) &&
        {
          terms: entry.synonym.map(syn => ({
            str: syn
          }))
        }),
      z: {
        dictAbbrev: entry.links.ontology.split('/').pop(),
        ...((entry.cui !== undefined) &&
          {
            cui: entry.cui // Concept Unique Identifiers
          }),
        ...((entry.semanticType !== undefined) &&
          {
            tui: entry.semanticType // Type Unique Identifiers
          })
      }
    }));
  }

  request(url, cb) {
    var req = this.getReqObj();
    req.onreadystatechange = function () {
      if (req.readyState === 4) {
        if (req.status !== 200)  cb('Error: req.status = ' + req.status);
        else {
          try {
            var response = JSON.parse(req.responseText);
            cb(null, response);
          }
          catch (err) { cb(err) }
        }
      }
    };
    req.open('GET', url, true);
    req.setRequestHeader('Authorization', 'apikey token=' + this.key);
    req.send();
  }

  getReqObj() {
    return new (typeof XMLHttpRequest !== 'undefined' ?
      XMLHttpRequest :  // In browser.
      require('xmlhttprequest').XMLHttpRequest  // In Node.js.
    )();
  }

  /** Check the case where you have two URLs, corresponding
   *  to cases where options.sort was defined but not
   *  options.filter or both were sufficiently defined to
   *  partition between preferred dictionaries (1st URL) and
   *  the rest (2nd URL). Such cases may have common results
   *  which we prune (pruning is done based on common `id` property)
   */
  pruneCommonResults(urlToResultsMap) {
    if (urlToResultsMap.size === 2) {
      var urls = Array.from(urlToResultsMap.keys());
      var firstURL = urls[0];
      var secondURL = urls[1];
      var matchObjArray1 = urlToResultsMap.get(firstURL);
      var matchObjArray2 = urlToResultsMap.get(secondURL);
      var ids1 = this.getIDsFromMatchObjArray(matchObjArray1);

      matchObjArray2 = matchObjArray2.filter(matchObj => {
        if (!ids1.includes(matchObj.id)) {
          return matchObj;
        } //else console.log('Prune: ' + matchObj.id);
      });
      urlToResultsMap.set(secondURL, matchObjArray2);
    }
    return urlToResultsMap;
  }

  extractOntologiesFromURL(url) {
    var regex = /&ontologies=(.*?)&/g;
    var res = regex.exec(url);
    if (res) return res[1]; else return '';
  }

  getIDsFromMatchObjArray(arr) {
    return arr.reduce((res, matchObj) => {
      if (matchObj.id) res.push(matchObj.id);
      return res;
    }, []);
  }

  sortMatches(arr, options) {
    if (this.hasProperSortDictIDProperty(options))
      return this.sortWithPreferredDict(arr, options);
    else
      return this.sortWithoutPreferredDict(arr);
  }

  hasProperFilterDictIDProperty(options) {
    return options.hasOwnProperty('filter') &&
      options.filter.hasOwnProperty('dictID') &&
      options.filter.dictID.length !== 0;
  }

  hasProperSortDictIDProperty(options) {
    return options.hasOwnProperty('sort') &&
      options.sort.hasOwnProperty('dictID') &&
      options.sort.dictID.length !== 0;
  }

  hasProperPageProperty(options) {
    // default value is 1 (from the API doc)
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
    // default value is 50 (from the API doc)
    return options.hasOwnProperty('perPage') &&
      Number.isInteger(options.perPage) &&
      options.perPage >= 1;
  }

  sortWithPreferredDict(arr, options) {
    return arr.sort( (a, b) =>
      this.dict_cmp(a, b, options.sort.dictID) ||
      this.str_cmp(a.type, b.type) ||
      this.str_cmp(a.str, b.str) ||
      this.str_cmp(a.dictID, b.dictID));
  }

  sortWithoutPreferredDict(arr) {
    return arr.sort( (a, b) =>
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

  dict_cmp(a, b, arrayDictIds) {
    return (
      arrayDictIds.includes(a.dictID) &&
      !arrayDictIds.includes(b.dictID) ? -1 :
        !arrayDictIds.includes(a.dictID) &&
        arrayDictIds.includes(b.dictID) ? 1 : 0);
  }

};
