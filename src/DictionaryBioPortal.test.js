const DictionaryBioPortal = require('./DictionaryBioPortal');
const chai = require('chai'); chai.should();
const expect = chai.expect;
const assert = chai.assert;
const nock = require('nock');
const fs = require('fs');
const path = require('path');

describe('DictionaryBioPortal.js', () => {

  var apiKey = 'testAPIKey';
  var testURLBase = 'http://test';
  var dictNoApiKey = new DictionaryBioPortal({baseUrl: testURLBase});
  var dict = new DictionaryBioPortal({baseUrl: testURLBase, apiKey: apiKey});
  var noContext = '&display_context=false';
  var melanomaStr = 'melanoma';
  var noResultsStr = 'somethingThatDoesNotExist';
  var numberStr = '5';
  var refStr = 'it';
  var melanomaURL = '/search?q=' + melanomaStr + noContext;
  var melanomaURLWithFilteredDicts = '/search?q=' + melanomaStr +
    '&ontologies=RADLEX,MCCL,VO' + noContext;
  var searchNumUrl = '/search?q=' + numberStr + noContext;
  var searchRefUrl = '/search?q=' + refStr + noContext;
  var noResultsUrl = '/search?q=' + noResultsStr + noContext;
  var jsonMelanomaPath = path.join(__dirname, '..', 'resources', 'query_melanoma_5_results.json');
  var jsonMelanomaFilteredPath = path.join(__dirname, '..', 'resources', 'query_melanoma_3_results.json');
  var jsonNoResultsPath = path.join(__dirname, '..', 'resources', 'query_no_results.json');
  var jsonMelanomaStringResponse = fs.readFileSync(jsonMelanomaPath, 'utf8');
  var jsonMelanomaFilteredStringResponse = fs.readFileSync(jsonMelanomaFilteredPath, 'utf8');
  var jsonNoResultsResponse = fs.readFileSync(jsonNoResultsPath, 'utf8');

  var matchObjArray =  [
    {
      id:     'http://purl.obolibrary.org/obo/DOID_1909',
      dictID: 'http://data.bioontology.org/ontologies/CLO',
      str:    'melanoma',
      descr:  'A cell type cancer that has_material_basis_in abnormally proliferating cells derives_from melanocytes which are found in skin, the bowel and the eye.',
      type:   'S',
      z: {
        dictAbbrev: 'CLO'
      }
    },
    {
      id:     'http://www.radlex.org/RID/#RID34617',
      dictID: 'http://data.bioontology.org/ontologies/RADLEX',
      str:    'melanoma',
      type:   'S',
      z: {
        dictAbbrev: 'RADLEX'
      }
    },
    {
      id:     'http://purl.obolibrary.org/obo/DOID_1909',
      dictID: 'http://data.bioontology.org/ontologies/VO',
      str:    'melanoma',
      descr:  'A cell type cancer that has_material_basis_in abnormally proliferating cells derived_from melanocytes which are found in skin, the bowel and the eye.',
      type:   'S',
      terms: [
        {
          str: 'malignant melanoma'
        },
        {
          str: 'Naevocarcinoma'
        }
      ],
      z: {
        dictAbbrev: 'VO'
      }
    },
    {
      id:     'http://scai.fraunhofer.de/CSEO#Melanoma',
      dictID: 'http://data.bioontology.org/ontologies/CSEO',
      str:    'Melanoma',
      type:   'T',
      z: {
        dictAbbrev: 'CSEO'
      }
    },
    {
      id:     'http://www.semanticweb.org/pallabi.d/ontologies/2014/2/untitled-ontology-11#Melanoma',
      dictID: 'http://data.bioontology.org/ontologies/MCCL',
      str:    'Melanoma',
      type:   'T',
      z: {
        dictAbbrev: 'MCCL'
      }
    }
  ];
  var matchObjArrayFilteredZPrunedAndSorted = [
    {
      id: 'http://www.radlex.org/RID/#RID34617',
      dictID: 'http://data.bioontology.org/ontologies/RADLEX',
      str: 'melanoma',
      type: 'S',
      z: {
        cui: [
          'C0025202'
        ]
      }
    },
    {
      id: 'http://purl.obolibrary.org/obo/DOID_1909',
      dictID: 'http://data.bioontology.org/ontologies/VO',
      str: 'melanoma',
      descr: 'A cell type cancer that has_material_basis_in abnormally proliferating cells derived_from melanocytes which are found in skin, the bowel and the eye.',
      type: 'S',
      terms: [
        {
          'str': 'malignant melanoma'
        },
        {
          'str': 'Naevocarcinoma'
        }
      ]
    },
    {
      id: 'http://www.semanticweb.org/pallabi.d/ontologies/2014/2/untitled-ontology-11#Melanoma',
      dictID: 'http://data.bioontology.org/ontologies/MCCL',
      str: 'Melanoma',
      type: 'T'
    }
  ];
  var testMatchObjArray = [
    {
      id:     'id1',
      dictID: 'http://test/ontologies/A',
      str:    'melanoma',
      descr:  'A definition',
      type:   'S',
      z: {
        dictAbbrev: 'A'
      }
    },
    {
      id:     'id2',
      dictID: 'http://test/ontologies/A',
      str:    'zelanoma',
      descr:  'A definition',
      type:   'S',
      z: {
        dictAbbrev: 'A'
      }
    },
    {
      id:     'id3',
      dictID: 'http://test/ontologies/A',
      str:    'xelanoma',
      descr:  'A definition',
      type:   'S',
      z: {
        dictAbbrev: 'A'
      }
    },
    {
      id:     'id4',
      dictID: 'http://test/ontologies/A',
      str:    'zelanoma',
      descr:  'A definition',
      type:   'T',
      z: {
        dictAbbrev: 'A'
      }
    },
    {
      id:     'id5',
      dictID: 'http://test/ontologies/c',
      str:    'melanoma',
      descr:  'A definition',
      type:   'T',
      z: {
        dictAbbrev: 'c'
      }
    },
    {
      id:     'id6',
      dictID: 'http://test/ontologies/b',
      str:    'melanoma',
      descr:  'A definition',
      type:   'S',
      z: {
        dictAbbrev: 'b'
      }
    }
  ];
  var testMatchObjArraySortedWithPrefDict = [
    {
      id: 'id5',
      dictID: 'http://test/ontologies/c',
      str: 'melanoma',
      descr: 'A definition',
      type: 'T',
      z: {
        dictAbbrev: 'c'
      }
    },
    {
      id: 'id1',
      dictID: 'http://test/ontologies/A',
      str: 'melanoma',
      descr: 'A definition',
      type: 'S',
      z: {
        dictAbbrev: 'A'
      }
    },
    {
      id: 'id6',
      dictID: 'http://test/ontologies/b',
      str: 'melanoma',
      descr: 'A definition',
      type: 'S',
      z: {
        dictAbbrev: 'b'
      }
    },
    {
      id: 'id3',
      dictID: 'http://test/ontologies/A',
      str: 'xelanoma',
      descr: 'A definition',
      type: 'S',
      z: {
        dictAbbrev: 'A'
      }
    },
    {
      id: 'id2',
      dictID: 'http://test/ontologies/A',
      str: 'zelanoma',
      descr: 'A definition',
      type: 'S',
      z: {
        dictAbbrev: 'A'
      }
    },
    {
      id: 'id4',
      dictID: 'http://test/ontologies/A',
      str: 'zelanoma',
      descr: 'A definition',
      type: 'T',
      z: {
        dictAbbrev: 'A'
      }
    }
  ];
  var testMatchObjArraySortedWithoutPrefDict = [
    {
      id:     'id1',
      dictID: 'http://test/ontologies/A',
      str:    'melanoma',
      descr:  'A definition',
      type:   'S',
      z: {
        dictAbbrev: 'A'
      }
    },
    {
      id:     'id6',
      dictID: 'http://test/ontologies/b',
      str:    'melanoma',
      descr:  'A definition',
      type:   'S',
      z: {
        dictAbbrev: 'b'
      }
    },
    {
      id:     'id3',
      dictID: 'http://test/ontologies/A',
      str:    'xelanoma',
      descr:  'A definition',
      type:   'S',
      z: {
        dictAbbrev: 'A'
      }
    },
    {
      id:     'id2',
      dictID: 'http://test/ontologies/A',
      str:    'zelanoma',
      descr:  'A definition',
      type:   'S',
      z: {
        dictAbbrev: 'A'
      }
    },
    {
      id:     'id5',
      dictID: 'http://test/ontologies/c',
      str:    'melanoma',
      descr:  'A definition',
      type:   'T',
      z: {
        dictAbbrev: 'c'
      }
    },
    {
      id:     'id4',
      dictID: 'http://test/ontologies/A',
      str:    'zelanoma',
      descr:  'A definition',
      type:   'T',
      z: {
        dictAbbrev: 'A'
      }
    },
  ];

  before(() => {
    // [Disabled this line until nock's `enableNetConnect()` works again...]:
    // nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  after(() => {
    nock.enableNetConnect();
  });

  describe('getEntryMatchesForString()', () => {
    it('calls its URL, with no apiKey given as an option', cb => {
      nock(testURLBase).get(melanomaURL).
        reply(401, undefined);
      dictNoApiKey.getEntryMatchesForString(melanomaStr, {}, (err, res) => {
        expect(err).to.equal('Error: req.status = 401');
        assert.typeOf(res, 'undefined');
        cb();
      });
    });

    it('returns empty array of match objects when the web server query ' +
      'does not return any result entry', cb => {
      nock(testURLBase).get(noResultsUrl).
        reply(200, jsonNoResultsResponse);
      dict.getEntryMatchesForString(noResultsStr, {}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({ items: [] });
        cb();
      });
    });

    it('calls its URL, with a test url+apiKey ' +
        'and returns proper vsm match objects', cb => {
      nock(testURLBase).get(melanomaURL).
        reply(200, jsonMelanomaStringResponse);
      dict.getEntryMatchesForString(melanomaStr, {}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({ items: matchObjArray });
        cb();
      });
    });

    it('calls its URL, with a test url+apiKey and options ' +
      'for filtering and z-pruning the results and returns proper ' +
      'vsm match objects', cb => {
      nock(testURLBase).get(melanomaURLWithFilteredDicts).
        reply(200, jsonMelanomaFilteredStringResponse);
      dict.getEntryMatchesForString(melanomaStr,
        {
          filter: { dictID:
            [ 'http://data.bioontology.org/ontologies/RADLEX',
              'http://data.bioontology.org/ontologies/MCCL',
              'http://data.bioontology.org/ontologies/VO'
            ]},
          sort: { dictID: [] },
          z: ['cui']
        }, (err, res) => {
          expect(err).to.equal(null);
          res.should.deep.equal({items: matchObjArrayFilteredZPrunedAndSorted});
          cb();
        });
    });

    it('calls its URL, with a test url+apiKey and options ' +
      'for sorting and z-pruning the results and ' +
      'returns proper trimmed vsm match objects', cb => {
      nock(testURLBase).get(melanomaURLWithFilteredDicts).
        reply(200, jsonMelanomaFilteredStringResponse);
      nock(testURLBase).get(melanomaURL).
        reply(200, jsonMelanomaStringResponse);

      // manually build the result array of objects
      var expectedFilteredResult = JSON.parse(
        JSON.stringify(matchObjArrayFilteredZPrunedAndSorted));
      expectedFilteredResult.push({
        dictID: 'http://data.bioontology.org/ontologies/CSEO',
        id: 'http://scai.fraunhofer.de/CSEO#Melanoma',
        str: 'Melanoma',
        type: 'T'
      });

      dict.getEntryMatchesForString(melanomaStr,
        {
          filter: { dictID: [] },
          sort: { dictID: [
            'http://data.bioontology.org/ontologies/RADLEX',
            'http://data.bioontology.org/ontologies/MCCL',
            'http://data.bioontology.org/ontologies/VO'
          ]},
          z: ['cui']
        }, (err, res) => {
          expect(err).to.equal(null);
          res.should.deep.equal({items: expectedFilteredResult});
          cb();
        });
    });
  });

  describe('getMatchesForString()', () => {

    it('lets the parent class add a number-string match', cb => {
      // we hypothesize the the server sends an empty results object
      nock(testURLBase).get(searchNumUrl).reply(200, jsonNoResultsResponse);
      dict.getMatchesForString(numberStr, {}, (err, res) => {
        res.should.deep.equal(
          {
            items: [{ id:'00:5e+0', dictID:'00', str:'5', descr:'number', type:'N' }]
          });
        cb();
      });
    });

    it('lets the parent class add a default refTerm match', cb => {
      // we hypothesize the the server sends an empty results object
      nock(testURLBase).get(searchRefUrl).reply(200, jsonNoResultsResponse);
      dict.getMatchesForString('it', {}, (err, res) => {
        res.should.deep.equal(
          {
            items: [{ id:'', dictID:'', str:'it', descr:'referring term', type:'R' }]
          });
        cb();
      });
    });
  });

  describe('buildURLs', () => {

    it('returns one URL only when there is neither options.filter and ' +
      'options.sort given, no matter the page asked', cb => {
      var options = {
        filter: { dictID : [] },
        sort: { dictID : [] },
        z: true,
        page: 1,
        perPage: 20
      };

      var res1 = dict.buildURLs(melanomaStr, options);
      var expectedResult1 = [
        'http://test/search?q=melanoma&page=1&pagesize=20&display_context=false'
      ];

      options.page = 20;
      var res2 = dict.buildURLs(melanomaStr, options);
      var expectedResult2 = [
        'http://test/search?q=melanoma&page=20&pagesize=20&display_context=false'
      ];

      res1.should.deep.equal(expectedResult1);
      res2.should.deep.equal(expectedResult2);
      cb();
    });

    it('returns one URL only when options.filter is given but no options.sort', cb => {
      var options = {
        filter: { dictID : [
          'http://test/ontologies/A',
          'http://test/ontologies/B',
          'http://test/ontologies/C'
        ]},
        sort: {},
        z: true,
        page: 1,
        perPage: 20
      };

      var res1 = dict.buildURLs(melanomaStr, options);
      var expectedResult1 = [
        'http://test/search?q=melanoma&ontologies=A,B,C&page=1&pagesize=20&display_context=false'
      ];

      options.page = 20;
      var res2 = dict.buildURLs(melanomaStr, options);
      var expectedResult2 = [
        'http://test/search?q=melanoma&ontologies=A,B,C&page=20&pagesize=20&display_context=false'
      ];

      res1.should.deep.equal(expectedResult1);
      res2.should.deep.equal(expectedResult2);
      cb();
    });

    it('returns proper URL(s) when options.sort is given but no options.filter, ' +
      'based on the options.page value', cb => {
      var options = {
        filter: { dictID : [] },
        sort: { dictID : [
          'http://test/ontologies/A',
          'http://test/ontologies/B',
          'http://test/ontologies/C'
        ]},
        z: true,
        page: 1
      };

      var res1 = dict.buildURLs(melanomaStr, options);
      var expectedResult1 = [
        'http://test/search?q=melanoma&ontologies=A,B,C&page=1&display_context=false',
        'http://test/search?q=melanoma&page=1&display_context=false'
      ];

      options.page = 2;
      var res2 = dict.buildURLs(melanomaStr, options);
      var expectedResult2 = [
        'http://test/search?q=melanoma&page=2&display_context=false'
      ];

      delete options.page;
      var res3 = dict.buildURLs(melanomaStr, options);
      var expectedResult3 = [
        'http://test/search?q=melanoma&ontologies=A,B,C&display_context=false',
        'http://test/search?q=melanoma&display_context=false'
      ];

      res1.should.deep.equal(expectedResult1);
      res2.should.deep.equal(expectedResult2);
      res3.should.deep.equal(expectedResult3);
      cb();
    });

    it('returns proper URL(s) when both options.sort and options.filter are given, ' +
      'based on the options.page value', cb => {
      var options = {
        filter: { dictID : [
          'http://test/ontologies/A',
          'http://test/ontologies/B',
          'http://test/ontologies/C'
        ]},
        sort: { dictID : [
          'http://test/ontologies/A'
        ]},
        z: true,
        page: 1,
        perPage: 20
      };

      // filter.dictID = {A,B,C}, sort.dictID = {A}, page = 1
      var res1 = dict.buildURLs(melanomaStr, options);
      var expectedResult1 = [
        'http://test/search?q=melanoma&ontologies=A&page=1&pagesize=20&display_context=false',
        'http://test/search?q=melanoma&ontologies=B,C&page=1&pagesize=20&display_context=false'
      ];

      // filter.dictID = {A,B,C}, sort.dictID = {A,C}, no page
      options.sort.dictID.push('http://test/ontologies/C');
      delete options.page;
      options.perPage = 10;
      var res2 = dict.buildURLs(melanomaStr, options);
      var expectedResult2 = [
        'http://test/search?q=melanoma&ontologies=A,C&pagesize=10&display_context=false',
        'http://test/search?q=melanoma&ontologies=B&pagesize=10&display_context=false'
      ];

      // filter.dictID = {A,B,C,D}, sort.dictID = {A,C}, page = 2
      options.filter.dictID.push('http://test/ontologies/D');
      options.page = 2;
      var res3 = dict.buildURLs(melanomaStr, options);
      var expectedResult3 = [
        'http://test/search?q=melanoma&ontologies=A,C,B,D&page=2&pagesize=10&display_context=false'
      ];

      // filter.dictID = {A,B}, sort.dictID = {A,C}, page = 2
      options.filter.dictID = options.filter.dictID.splice(0,2);
      var res4 = dict.buildURLs(melanomaStr, options);
      var expectedResult4 = [
        'http://test/search?q=melanoma&ontologies=A,B&page=2&pagesize=10&display_context=false'
      ];

      // filter.dictID = {A,B,F}, sort.dictID = {A,C}, page = 3
      options.filter.dictID.push('http://test/ontologies/F');
      options.page = 3;
      var res5 = dict.buildURLs(melanomaStr, options);
      var expectedResult5 = [
        'http://test/search?q=melanoma&ontologies=A,B,F&page=3&pagesize=10&display_context=false'
      ];

      // filter.dictID = {A,B,F}, sort.dictID = {A,C}, no page
      delete options.page;
      var res6 = dict.buildURLs(melanomaStr, options);
      var expectedResult6 = [
        'http://test/search?q=melanoma&ontologies=A&pagesize=10&display_context=false',
        'http://test/search?q=melanoma&ontologies=B,F&pagesize=10&display_context=false'
      ];

      // filter.dictID = {A,B,F}, sort.dictID = {A,B,F}, no page
      options.sort.dictID.pop();
      options.sort.dictID.push('http://test/ontologies/B');
      options.sort.dictID.push('http://test/ontologies/F');
      var res7 = dict.buildURLs(melanomaStr, options);
      var expectedResult7 = [
        'http://test/search?q=melanoma&ontologies=A,B,F&pagesize=10&display_context=false'
      ];

      options.page = 20;
      var res8 = dict.buildURLs(melanomaStr, options);
      var expectedResult8 = [
        'http://test/search?q=melanoma&ontologies=A,B,F&page=20&pagesize=10&display_context=false'
      ];

      // filter.dictID = {A,B,F}, sort.dictID = {A,B,F,G}, page 20
      options.sort.dictID.push('http://test/ontologies/G');
      var res9 = dict.buildURLs(melanomaStr, options);

      res1.should.deep.equal(expectedResult1);
      res2.should.deep.equal(expectedResult2);
      res3.should.deep.equal(expectedResult3);
      res4.should.deep.equal(expectedResult4);
      res5.should.deep.equal(expectedResult5);
      res6.should.deep.equal(expectedResult6);
      res7.should.deep.equal(expectedResult7);
      res8.should.deep.equal(expectedResult8);
      res9.should.deep.equal(expectedResult8);
      cb();
    });
  });

  describe('splitDicts', () => {

    it('returns empty dictionaries when neither filter nor sort properties ' +
      'are given or are empty', cb => {
      var options1 = { page: 1 };
      var options2 = {
        filter: { dictID: [] },
        sort: { dictID: [] }
      };

      var res1 = dict.splitDicts(options1);
      var res2 = dict.splitDicts(options2);
      var expectedResult = { pref: [], rest: [] };

      res1.should.deep.equal(expectedResult);
      res2.should.deep.equal(expectedResult);
      cb();
    });

    it('splits dictionaries properly when no or empty sort property is given', cb => {
      var options1 = {
        filter: { dictID: ['a','b'] },
        page: 3
      };

      var options2 = {
        filter: { dictID: ['a','b'] } ,
        sort: { dictID: [] }
      };

      var expectedResult = {
        pref: [],
        rest: ['a','b']
      };

      var res1 = dict.splitDicts(options1);
      var res2 = dict.splitDicts(options2);

      res1.should.deep.equal(expectedResult);
      res2.should.deep.equal(expectedResult);
      cb();
    });

    it('splits dictionaries properly when no or empty filter property is given', cb => {
      var options1 = {
        sort: { dictID: ['d','e'] },
        page: 3
      };

      var options2 = {
        filter: { dictID: [] },
        sort: { dictID: ['d','e'] }
      };

      var expectedResult = {
        pref: ['d','e'],
        rest: []
      };

      var res1 = dict.splitDicts(options1);
      var res2 = dict.splitDicts(options2);

      res1.should.deep.equal(expectedResult);
      res2.should.deep.equal(expectedResult);
      cb();
    });

    it('splits dictionaries properly when both filter and sort ' +
      'properties are given ', cb => {
      var options1 = {
        filter: { dictID: ['a','b','c','d'] },
        sort: { dictID: ['a','c'] }
      };

      var expectedResult1 = {
        pref: ['a','c'],
        rest: ['b','d']
      };

      var options2 = {
        filter: { dictID: ['a','b','c','d'] },
        sort: { dictID: ['e','b'] }
      };

      var expectedResult2 = {
        pref: ['b'],
        rest: ['a','c','d']
      };

      var options3 = {
        filter: { dictID: ['a','b','c','d'] },
        sort: { dictID: ['e','f'] }
      };

      var expectedResult3 = {
        pref: [],
        rest: ['a','b','c','d']
      };

      var options4 = {
        filter: { dictID: ['e','b'] },
        sort: { dictID: ['e','b'] }
      };

      var expectedResult4 = {
        pref: [],
        rest: ['e','b']
      };

      var options5 = {
        filter: { dictID: ['a','b'] },
        sort: { dictID: ['a','b','c','d'] }
      };

      var expectedResult5 = {
        pref: [],
        rest: ['a','b']
      };

      var options6 = {
        filter: { dictID: ['e','f'] },
        sort: { dictID: ['a','b','c','d'] }
      };

      var expectedResult6 = {
        pref: [],
        rest: ['e','f']
      };

      var res1 = dict.splitDicts(options1);
      var res2 = dict.splitDicts(options2);
      var res3 = dict.splitDicts(options3);
      var res4 = dict.splitDicts(options4);
      var res5 = dict.splitDicts(options5);
      var res6 = dict.splitDicts(options6);

      res1.should.deep.equal(expectedResult1);
      res2.should.deep.equal(expectedResult2);
      res3.should.deep.equal(expectedResult3);
      res4.should.deep.equal(expectedResult4);
      res5.should.deep.equal(expectedResult5);
      res6.should.deep.equal(expectedResult6);

      cb();
    });
  });

  describe('pruneCommonResults', () => {

    it('doesn\'t prune input map if it does not have 2 URLs', cb => {
      var urlToResultsMap = new Map();
      dict.pruneCommonResults(urlToResultsMap).should.deep.equal(urlToResultsMap);

      var url1 = 'http://test/search?q=melanoma&ontologies=A&page=1&display_context=false';
      var res1 = [
        { id: 'id1', dictID: 'http://data.bioontology.org/ontologies/A' },
        { id: 'id2', dictID: 'http://data.bioontology.org/ontologies/A' }
      ];
      urlToResultsMap.set(url1, res1);

      dict.pruneCommonResults(urlToResultsMap).should.deep.equal(urlToResultsMap);
      cb();
    });

    it('doesn\'t prune input map if there are no common results', cb => {
      var urlToResultsMap = new Map();
      var url1 = 'http://test/search?q=melanoma&ontologies=A&page=1&display_context=false';
      var res1 = [
        { id: 'id1', dictID: 'http://data.bioontology.org/ontologies/A' },
        { id: 'id2', dictID: 'http://data.bioontology.org/ontologies/A' }
      ];
      var url2 = 'http://test/search?q=melanoma&ontologies=B&page=1&display_context=false';
      var res2 = [
        { id: 'id3', dictID: 'http://data.bioontology.org/ontologies/B' },
        { id: 'id4', dictID: 'http://data.bioontology.org/ontologies/B' }
      ];
      urlToResultsMap.set(url1, res1);
      urlToResultsMap.set(url2, res2);

      dict.pruneCommonResults(urlToResultsMap).should.deep.equal(urlToResultsMap);
      cb();
    });

    it('correctly prunes input map when there are common results', cb => {
      var urlToResultsMap = new Map();
      var url1 = 'http://test/search?q=melanoma&ontologies=A&page=1&display_context=false';
      var res1 = [
        { id: 'id1', dictID: 'http://data.bioontology.org/ontologies/A' },
        { id: 'id2', dictID: 'http://data.bioontology.org/ontologies/A' },
        { id: 'id3', dictID: 'http://data.bioontology.org/ontologies/A' }
      ];
      var url2 = 'http://test/search?q=melanoma&page=1&display_context=false';
      var res2 = [
        { id: 'id2', dictID: 'http://data.bioontology.org/ontologies/B' },
        { id: 'id1', dictID: 'http://data.bioontology.org/ontologies/C' },
        { id: 'id4', dictID: 'http://data.bioontology.org/ontologies/D' }
      ];
      urlToResultsMap.set(url1, res1);
      urlToResultsMap.set(url2, res2);

      var expectedUrlToResultsMap = new Map();
      expectedUrlToResultsMap.set(url1, res1);
      var prunedRes = [
        { id: 'id4', dictID: 'http://data.bioontology.org/ontologies/D' }
      ];
      expectedUrlToResultsMap.set(url2, prunedRes);

      var actualUrlToResultsMap = dict.pruneCommonResults(urlToResultsMap);
      actualUrlToResultsMap.should.deep.equal(expectedUrlToResultsMap);
      cb();
    });

  });

  describe('extractOntologiesFromURL', () => {

    it('returns correct matched ontology names', cb => {
      var url1 = 'http://test/search?q=melanoma&ontologies=A&page=1&pagesize=20&display_context=false';
      var url2 = 'http://test/search?q=melanoma&ontologies=A,B,C-RT_B&page=1&pagesize=20&display_context=false';

      dict.extractOntologiesFromURL(url1).should.equal('A');
      dict.extractOntologiesFromURL(url2).should.equal('A,B,C-RT_B');
      cb();
    });

    it('returns an empty string when the `ontologies` part of the URL ' +
      'is missing', cb => {
      var url = 'http://test/search?q=melanoma&display_context=false';

      dict.extractOntologiesFromURL(url).should.equal('');
      cb();
    });
  });

  describe('getIDsFromMatchObjArray', () => {

    it('returns all the ids from an array of vsm-match objects', cb => {
      const arr = [
        {
          id: 'id1',
          str: 'str1'
        },
        {
          id: 'id2',
          str: 'str2'
        },
        {
          id: 'id3',
          str: 'str3'
        }
      ];

      var res = dict.getIDsFromMatchObjArray(arr);
      var expectedResult = ['id1','id2','id3'];

      res.should.deep.equal(expectedResult);
      cb();
    });

    it('returns an empty array when input is either an empty array, ' +
      'or an array whose elements don\'t have the `id` property', cb => {
      const arr1 = [];
      const arr2 = [
        {
          dictID: 'id1',
          str: 'str1'
        },
        {
          dictID: 'id2',
          str: 'str2'
        }
      ];

      var res1 = dict.getIDsFromMatchObjArray(arr1);
      var res2 = dict.getIDsFromMatchObjArray(arr2);

      res1.should.deep.equal([]);
      res2.should.deep.equal([]);
      cb();
    });

    it('returns proper result when the input array has \'mixed\' elements ' +
      '- some that have the `id` property and some that don\'t', cb => {
      const arr = [
        {
          id: 'id1',
          str: 'str1'
        },
        {
          dictID: 'id2',
          str: 'str2'
        },
        {
          id: 'id3',
          str: 'str3'
        }
      ];

      var res = dict.getIDsFromMatchObjArray(arr);
      var expectedResult = ['id1', 'id3'];

      res.should.deep.equal(expectedResult);
      cb();
    });
  });

  describe('prepareURLString', () => {

    it('returns proper url when ontologiesArray is empty', cb => {
      var url = dict.prepareURLString(melanomaStr, {}, []);
      url.should.equal(testURLBase + '/search?q=melanoma&display_context=false');
      cb();
    });

    it('returns proper url when ontologiesArray is non-empty', cb => {
      var url = dict.prepareURLString(melanomaStr, {}, ['A','B','C']);
      url.should.equal(testURLBase + '/search?q=melanoma&ontologies=A,B,C&display_context=false');
      cb();
    });

    it('returns proper url when the page property is not a number', cb => {
      var url = dict.prepareURLString(melanomaStr, { page : 'String' }, []);
      url.should.equal(testURLBase + '/search?q=melanoma&display_context=false');
      cb();
    });

    it('returns proper url when the page property is a non-valid integer', cb => {
      var url = dict.prepareURLString(melanomaStr, { page : 0 }, []);
      url.should.equal(testURLBase + '/search?q=melanoma&display_context=false');
      cb();
    });

    it('returns proper url when the page property is a valid integer', cb => {
      var url = dict.prepareURLString(melanomaStr, { page : 2 }, ['A']);
      url.should.equal(testURLBase + '/search?q=melanoma&ontologies=A&page=2&display_context=false');
      cb();
    });

    it('returns proper url when the perPage property is not a number', cb => {
      var url = dict.prepareURLString(melanomaStr, { perPage : ['Str'] }, []);
      url.should.equal(testURLBase + '/search?q=melanoma&display_context=false');
      cb();
    });

    it('returns proper url when the perPage property is a non-valid integer', cb => {
      var url = dict.prepareURLString(melanomaStr, { perPage : 0 }, []);
      url.should.equal(testURLBase + '/search?q=melanoma&display_context=false');
      cb();
    });

    it('returns proper url when the perPage property is a valid integer', cb => {
      var url = dict.prepareURLString(melanomaStr, { perPage : 1 }, ['A','B']);
      url.should.equal(testURLBase + '/search?q=melanoma&ontologies=A,B&pagesize=1&display_context=false');
      cb();
    });
  });

  describe('sortMatches', () => {

    it('sorts results taking care of the preferred dictionaries first', cb => {
      var options = { sort: { dictID: ['http://test/ontologies/c'] }};
      var arr = dict.sortMatches(testMatchObjArray, options);
      arr.should.deep.equal(testMatchObjArraySortedWithPrefDict);
      cb();
    });

    it('sorts results normally when no proper sort.dictID property is present', cb => {
      var arr = dict.sortMatches(testMatchObjArray, {});
      arr.should.deep.equal(testMatchObjArraySortedWithoutPrefDict);
      cb();
    });
  });

  describe('sortWithPreferredDict', () => {
    it('sorts results taking care of the preferred dictionaries first', cb => {
      var arr = dict.sortWithPreferredDict(testMatchObjArray,
        { sort: { dictID: ['http://test/ontologies/c'] }});
      arr.should.deep.equal(testMatchObjArraySortedWithPrefDict);
      cb();
    });
  });

  describe('sortWithoutPreferredDict', () => {
    it('sorts results normally (as specified in the documentation)', cb => {
      var arr = dict.sortWithoutPreferredDict(testMatchObjArray);
      arr.should.deep.equal(testMatchObjArraySortedWithoutPrefDict);
      cb();
    });
  });

});
