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

    /*
    this.urlGetDictInfos = opt.urlGetDictInfos ||
			baseUrl + '/dic?id=$filterID&name=$filterName&sort=$sort' + pp;
	this.urlGetEntries   = opt.urlGetEntries   ||
			baseUrl + '/ent?id=$filterID&dictID=$filterDictID&z=$z&sort=$sort'+ pp;
	*/

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
    if (!str)  return cb(null, {items: []});

    var url = this.prepareURLString(str, options);
    console.log('URL: ' + url);

    this.request(url, (err, res) => {
      if (err) return cb(err);
      this.processBioPortalResponse(res, str, (err, matchObjArray) => {
        var arr = Dictionary.zPropPrune(matchObjArray, options.z);
        cb(err, { items : this.sortMatches(arr, options) });
      });
    });
  }

  prepareURLString(str, options) {
    var url = this.urlGetMatches
      .replace('$queryString', encodeURIComponent(str));

    if (options.hasOwnProperty('filter') &&
        options.filter.hasOwnProperty('dictID') &&
        options.filter.dictID.length !== 0) {
      var onto = options.filter.dictID.toString();
      url += '&ontologies=' + onto;
    }

    // default value is 1 (from the API doc)
    if (options.hasOwnProperty('page') &&
        Number.isInteger(options.page) &&
        options.page >= 1) {
      var pageNumber = options.page;
      url += '&page=' + pageNumber;
    }

    // default value is 50 (from the API doc)
    if (options.hasOwnProperty('perPage') &&
        Number.isInteger(options.perPage) &&
        options.perPage >= 1) {
      var NumOfResultsPerPage = options.perPage;
      url += '&pagesize=' + NumOfResultsPerPage;
    }

    url += this.noContextField;
    return url;
  }

  processBioPortalResponse(res, str, cb) {
    var matchObjArray = res.collection.map(entry => ({
      id: entry['@id'],
      dictID: entry.links.ontology.split('/').pop(),
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
        dictURL: entry.links.ontology,
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
    cb(null, matchObjArray);
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

  sortMatches(arr, options) {
    if ((options.hasOwnProperty('sort')) &&
      (options.sort.hasOwnProperty('dictID')) &&
      (options.sort.dictID.length !== 0))
      return this.sortWithPreferredDict(arr, options);
    else
      return this.sortWithoutPreferredDict(arr);
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
