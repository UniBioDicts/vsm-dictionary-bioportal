const DictionaryBioPortal = require('./DictionaryBioPortal');
const chai = require('chai'); chai.should();
const expect = chai.expect;
const assert = chai.assert;
const nock = require('nock');
const fs = require('fs');
const path = require('path');

describe('DictionaryBioPortal.js', () => {

  const apiKey = 'testAPIKey';
  const testURLBase = 'http://test';
  const dictNoApiKey = new DictionaryBioPortal({baseUrl: testURLBase});
  const dict = new DictionaryBioPortal({baseUrl: testURLBase, apiKey: apiKey});
  const noContext = '&display_context=false';
  const melanomaStr = 'melanoma';
  const searchStr = '/search?q=';
  const noResultsStr = 'somethingThatDoesNotExist';
  const numberStr = '5';
  const refStr = 'it';

  const melanomaURL = searchStr + melanomaStr + noContext;
  const melanomaURLWithFilteredDicts = searchStr + melanomaStr +
    '&ontologies=RADLEX,MCCL,VO' + noContext;
  const searchNumURL = searchStr + numberStr + noContext;
  const searchRefURL = searchStr + refStr + noContext;
  const noResultsURL = searchStr + noResultsStr + noContext;
  const errorQuery1URL = '/search?q=a&ontologies=NonValidAcronym' + noContext;
  const errorQuery2URL = '/ontologies/nonValidAcronym' + noContext;

  const jsonMelanoma5resultsPath = path.join(__dirname, '..',
    'resources', 'query_melanoma_5_results.json');
  const jsonMelanoma3resultsPath = path.join(__dirname, '..',
    'resources', 'query_melanoma_3_results.json');
  const jsonMelanoma1resultPath = path.join(__dirname, '..',
    'resources', 'query_melanoma_1_result.json');
  const jsonNoResultsPath = path.join(__dirname, '..',
    'resources', 'query_no_results.json');
  const jsonGOontologyInfoPath = path.join(__dirname, '..',
    'resources', 'query_go_ontology.json');
  const json3ontologiesInfoPath = path.join(__dirname, '..',
    'resources', 'query_all_ontologies_pruned.json');
  const jsonNotValidAPIkeyPath = path.join(__dirname, '..',
    'resources', 'not_valid_api_key_error.json');
  const jsonError1Path = path.join(__dirname, '..',
    'resources', 'error1.json');
  const jsonError2Path = path.join(__dirname, '..',
    'resources', 'error2.json');

  const melanoma5resultsJSONString =
    fs.readFileSync(jsonMelanoma5resultsPath, 'utf8');
  const melanoma3resultsJSONString =
    fs.readFileSync(jsonMelanoma3resultsPath, 'utf8');
  const melanoma1resultJSONString =
    fs.readFileSync(jsonMelanoma1resultPath, 'utf8');
  const melanomaNoResultsJSONString =
    fs.readFileSync(jsonNoResultsPath, 'utf8');
  const goOntologyInfoJSONString =
    fs.readFileSync(jsonGOontologyInfoPath, 'utf8');
  const threeOntologiesInfoJSONString =
    fs.readFileSync(json3ontologiesInfoPath, 'utf8');
  const notValidAPIkeyJSONString =
    fs.readFileSync(jsonNotValidAPIkeyPath, 'utf8');
  const error1JSONString =
    fs.readFileSync(jsonError1Path, 'utf8');
  const error2JSONString =
    fs.readFileSync(jsonError2Path, 'utf8');

  const matchObjArray = [
    {
      id: 'http://purl.obolibrary.org/obo/DOID_1909',
      dictID: 'http://data.bioontology.org/ontologies/CLO',
      str: 'melanoma',
      descr: 'A cell type cancer that has_material_basis_in abnormally proliferating cells derives_from melanocytes which are found in skin, the bowel and the eye.',
      type: 'S',
      terms: [
        {
          str: 'melanoma'
        }
      ],
      z: {
        dictAbbrev: 'CLO'
      }
    },
    {
      id: 'http://www.radlex.org/RID/#RID34617',
      dictID: 'http://data.bioontology.org/ontologies/RADLEX',
      str: 'melanoma',
      type: 'S',
      terms: [
        {
          str: 'melanoma'
        }
      ],
      z: {
        dictAbbrev: 'RADLEX'
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
          str: 'melanoma'
        },
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
      id: 'http://scai.fraunhofer.de/CSEO#Melanoma',
      dictID: 'http://data.bioontology.org/ontologies/CSEO',
      str: 'Melanoma',
      type: 'T',
      terms: [
        {
          str: 'Melanoma'
        }
      ],
      z: {
        dictAbbrev: 'CSEO'
      }
    },
    {
      id: 'http://www.semanticweb.org/pallabi.d/ontologies/2014/2/untitled-ontology-11#Melanoma',
      dictID: 'http://data.bioontology.org/ontologies/MCCL',
      str: 'Melanoma',
      type: 'T',
      terms: [
        {
          str: 'Melanoma'
        }
      ],
      z: {
        dictAbbrev: 'MCCL'
      }
    }
  ];
  const matchObjArrayFilteredZPrunedAndSorted = [
    {
      id: 'http://www.radlex.org/RID/#RID34617',
      dictID: 'http://data.bioontology.org/ontologies/RADLEX',
      str: 'melanoma',
      type: 'S',
      terms: [
        {
          str: 'melanoma'
        }
      ],
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
          str: 'melanoma'
        },
        {
          str: 'malignant melanoma'
        },
        {
          str: 'Naevocarcinoma'
        }
      ]
    },
    {
      id: 'http://www.semanticweb.org/pallabi.d/ontologies/2014/2/untitled-ontology-11#Melanoma',
      dictID: 'http://data.bioontology.org/ontologies/MCCL',
      str: 'Melanoma',
      type: 'T',
      terms: [
        {
          str: 'Melanoma'
        }
      ]
    }
  ];
  const testMatchObjArray = [
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
  const testMatchObjArraySortedWithPrefDict = [
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
  const testMatchObjArraySortedWithoutPrefDict = [
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

  describe('getDictInfos', () => {
    it.skip('returns proper formatted error for non-valid ontology acronym', cb => {
      nock(testURLBase).get(errorQuery2URL).
        reply(404, error2JSONString);
      dict.getDictInfos({ filter: { id : [
        'http://data.bioontology.org/ontologies/NonValidAcronym'
      ]}},(err, res) => {
        err.should.deep.equal({
          errors: [
            'You must provide a valid `acronym` to retrieve an ontology'
          ],
          status: 404
        });
        assert.typeOf(res, 'undefined');
        cb();
      });
    });

  });

  describe('getEntryMatchesForString', () => {
    it('calls its URL, with no apiKey given as an option', cb => {
      nock(testURLBase).get(melanomaURL).
        reply(401, notValidAPIkeyJSONString);
      dictNoApiKey.getEntryMatchesForString(melanomaStr, {}, (err, res) => {
        err.should.deep.equal({
          status: 401,
          error: 'You must provide a valid API Key. Your API Key can be obtained by logging in at bioportal.bioontology.org/account'
        });
        assert.typeOf(res, 'undefined');
        cb();
      });
    });

    it('returns proper formatted error for non-valid ontology acronym in search' +
      'query', cb => {
      nock(testURLBase).get(errorQuery1URL).
        reply(404, error1JSONString);
      dict.getEntryMatchesForString('a', { filter: { dictID : [
        'http://data.bioontology.org/ontologies/NonValidAcronym'
      ]}},(err, res) => {
        err.should.deep.equal({
          errors: [
            'The ontologies parameter `[NonValidAcronym]` includes non-existent acronyms. Notice that acronyms are case sensitive.'
          ],
          status: 404
        });
        assert.typeOf(res, 'undefined');
        cb();
      });
    });

    it('returns empty array of match objects when the web server query ' +
      'does not return any result entry', cb => {
      nock(testURLBase).get(noResultsURL).
        reply(200, melanomaNoResultsJSONString);
      dict.getEntryMatchesForString(noResultsStr, {}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({ items: [] });
        cb();
      });
    });

    it('returns empty array of match objects when the search string is ' +
      'empty', cb => {
      dict.getEntryMatchesForString('', {}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({ items: [] });
        cb();
      });
    });

    it('calls its URL, with a test url+apiKey ' +
        'and returns proper vsm match objects', cb => {
      nock(testURLBase).get(melanomaURL).
        reply(200, melanoma5resultsJSONString);
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
        reply(200, melanoma3resultsJSONString);
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
        reply(200, melanoma3resultsJSONString);
      nock(testURLBase).get(melanomaURL).
        reply(200, melanoma5resultsJSONString);

      // manually build the result array of objects
      var expectedFilteredResult = JSON.parse(
        JSON.stringify(matchObjArrayFilteredZPrunedAndSorted));
      expectedFilteredResult.push({
        dictID: 'http://data.bioontology.org/ontologies/CSEO',
        id: 'http://scai.fraunhofer.de/CSEO#Melanoma',
        str: 'Melanoma',
        type: 'T',
        terms: [
          {
            str: 'Melanoma'
          }
        ]
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

  describe('getMatchesForString', () => {

    it('lets the parent class add a number-string match', cb => {
      // we hypothesize the the server sends an empty results object
      nock(testURLBase).get(searchNumURL).reply(200, melanomaNoResultsJSONString);
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
      nock(testURLBase).get(searchRefURL).reply(200, melanomaNoResultsJSONString);
      dict.getMatchesForString('it', {}, (err, res) => {
        res.should.deep.equal(
          {
            items: [{ id:'', dictID:'', str:'it', descr:'referring term', type:'R' }]
          });
        cb();
      });
    });
  });

  describe('buildDictInfoURLs', () => {

    it('returns one global URL if there is no proper filter.id array ' +
      'of dictIDs', cb => {
      var options1 = {
        page: 2
      };
      var options2 = {
        filter: {},
        page: 1
      };
      var options3 = {
        filter: { dict: {} }
      };
      var options4 = {
        filter: { id: 'any' }
      };
      var options5 = {
        filter: { id: [] }
      };
      var options6 = {};

      var res1 = dict.buildDictInfoURLs(options1);
      var res2 = dict.buildDictInfoURLs(options2);
      var res3 = dict.buildDictInfoURLs(options3);
      var res4 = dict.buildDictInfoURLs(options4);
      var res5 = dict.buildDictInfoURLs(options5);
      var res6 = dict.buildDictInfoURLs(options6);
      var expectedResult = [testURLBase + '/ontologies/?display_context=false'];

      res1.should.deep.equal(expectedResult);
      res2.should.deep.equal(expectedResult);
      res3.should.deep.equal(expectedResult);
      res4.should.deep.equal(expectedResult);
      res5.should.deep.equal(expectedResult);
      res6.should.deep.equal(expectedResult);

      cb();
    });

    it('returns an array of URLs corresponding to the ontologies ' +
      'that were taken from the filter.id array ', cb => {
      var options = {
        filter: { id: [
          'http://data.bioontology.org/ontologies/CLO',
          'http://data.bioontology.org/ontologies/RH-MESH',
          'http://data.bioontology.org/ontologies/MCCL'
        ]},
        page: 2,
        perPage: 2
      };
      var res = dict.buildDictInfoURLs(options);
      var expectedResult = [
        testURLBase + '/ontologies/CLO?display_context=false',
        testURLBase + '/ontologies/RH-MESH?display_context=false',
        testURLBase + '/ontologies/MCCL?display_context=false'
      ];
      res.should.deep.equal(expectedResult);
      cb();
    });

  });

  describe('buildMatchURLs', () => {

    it('returns one URL only when there is neither options.filter and ' +
      'options.sort given, no matter the page asked', cb => {
      var options = {
        filter: { dictID : [] },
        sort: { dictID : [] },
        z: true,
        page: 1,
        perPage: 20
      };

      var res1 = dict.buildMatchURLs(melanomaStr, options);
      var expectedResult1 = [
        'http://test/search?q=melanoma&page=1&pagesize=20&display_context=false'
      ];

      options.page = 20;
      var res2 = dict.buildMatchURLs(melanomaStr, options);
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

      var res1 = dict.buildMatchURLs(melanomaStr, options);
      var expectedResult1 = [
        'http://test/search?q=melanoma&ontologies=A,B,C&page=1&pagesize=20&display_context=false'
      ];

      options.page = 20;
      var res2 = dict.buildMatchURLs(melanomaStr, options);
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

      var res1 = dict.buildMatchURLs(melanomaStr, options);
      var expectedResult1 = [
        'http://test/search?q=melanoma&ontologies=A,B,C&page=1&display_context=false',
        'http://test/search?q=melanoma&page=1&display_context=false'
      ];

      options.page = 2;
      var res2 = dict.buildMatchURLs(melanomaStr, options);
      var expectedResult2 = [
        'http://test/search?q=melanoma&page=2&display_context=false'
      ];

      delete options.page;
      var res3 = dict.buildMatchURLs(melanomaStr, options);
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
      var res1 = dict.buildMatchURLs(melanomaStr, options);
      var expectedResult1 = [
        'http://test/search?q=melanoma&ontologies=A&page=1&pagesize=20&display_context=false',
        'http://test/search?q=melanoma&ontologies=B,C&page=1&pagesize=20&display_context=false'
      ];

      // filter.dictID = {A,B,C}, sort.dictID = {A,C}, no page
      options.sort.dictID.push('http://test/ontologies/C');
      delete options.page;
      options.perPage = 10;
      var res2 = dict.buildMatchURLs(melanomaStr, options);
      var expectedResult2 = [
        'http://test/search?q=melanoma&ontologies=A,C&pagesize=10&display_context=false',
        'http://test/search?q=melanoma&ontologies=B&pagesize=10&display_context=false'
      ];

      // filter.dictID = {A,B,C,D}, sort.dictID = {A,C}, page = 2
      options.filter.dictID.push('http://test/ontologies/D');
      options.page = 2;
      var res3 = dict.buildMatchURLs(melanomaStr, options);
      var expectedResult3 = [
        'http://test/search?q=melanoma&ontologies=A,C,B,D&page=2&pagesize=10&display_context=false'
      ];

      // filter.dictID = {A,B}, sort.dictID = {A,C}, page = 2
      options.filter.dictID = options.filter.dictID.splice(0,2);
      var res4 = dict.buildMatchURLs(melanomaStr, options);
      var expectedResult4 = [
        'http://test/search?q=melanoma&ontologies=A,B&page=2&pagesize=10&display_context=false'
      ];

      // filter.dictID = {A,B,F}, sort.dictID = {A,C}, page = 3
      options.filter.dictID.push('http://test/ontologies/F');
      options.page = 3;
      var res5 = dict.buildMatchURLs(melanomaStr, options);
      var expectedResult5 = [
        'http://test/search?q=melanoma&ontologies=A,B,F&page=3&pagesize=10&display_context=false'
      ];

      // filter.dictID = {A,B,F}, sort.dictID = {A,C}, no page
      delete options.page;
      var res6 = dict.buildMatchURLs(melanomaStr, options);
      var expectedResult6 = [
        'http://test/search?q=melanoma&ontologies=A&pagesize=10&display_context=false',
        'http://test/search?q=melanoma&ontologies=B,F&pagesize=10&display_context=false'
      ];

      // filter.dictID = {A,B,F}, sort.dictID = {A,B,F}, no page
      options.sort.dictID.pop();
      options.sort.dictID.push('http://test/ontologies/B');
      options.sort.dictID.push('http://test/ontologies/F');
      var res7 = dict.buildMatchURLs(melanomaStr, options);
      var expectedResult7 = [
        'http://test/search?q=melanoma&ontologies=A,B,F&pagesize=10&display_context=false'
      ];

      options.page = 20;
      var res8 = dict.buildMatchURLs(melanomaStr, options);
      var expectedResult8 = [
        'http://test/search?q=melanoma&ontologies=A,B,F&page=20&pagesize=10&display_context=false'
      ];

      // filter.dictID = {A,B,F}, sort.dictID = {A,B,F,G}, page 20
      options.sort.dictID.push('http://test/ontologies/G');
      var res9 = dict.buildMatchURLs(melanomaStr, options);

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

  describe('mapBioPortalResToDictInfoObj', () => {
    it('properly maps BioPortal\'s returned JSON object to a VSM dictInfo' +
      'object', cb => {

      var res1 = dict.mapBioPortalResToDictInfoObj(
        JSON.parse(goOntologyInfoJSONString)
      );
      var res2 = dict.mapBioPortalResToDictInfoObj(
        JSON.parse(threeOntologiesInfoJSONString)
      );

      var expectedResult1 = [
        {
          id:     'http://data.bioontology.org/ontologies/GO',
          abbrev: 'GO',
          name:   'Gene Ontology'
        }
      ];
      var expectedResult2 = [
        {
          id: 'http://data.bioontology.org/ontologies/ICO',
          abbrev: 'ICO',
          name: 'Informed Consent Ontology'
        },
        {
          id: 'http://data.bioontology.org/ontologies/GEOSPECIES',
          abbrev: 'GEOSPECIES',
          name: 'GeoSpecies Ontology'
        },
        {
          id: 'http://data.bioontology.org/ontologies/TEO',
          abbrev: 'TEO',
          name: 'Time Event Ontology'
        }
      ];

      res1.should.deep.equal(expectedResult1);
      res2.should.deep.equal(expectedResult2);
      cb();
    });
  });

  describe('mapBioPortalResToEntryObj', () => {

    it('properly maps BioPortal\'s returned JSON object to a VSM entry' +
      'object', cb => {

      var res = dict.mapBioPortalResToEntryObj(
        JSON.parse(melanoma1resultJSONString)
      );
      var expectedResult = [
        {
          id:     'http://www.radlex.org/RID/#RID34617',
          dictID: 'http://data.bioontology.org/ontologies/RADLEX',
          descr:  'A cell type cancer that has_material_basis_in abnormally proliferating cells derived_from melanocytes which are found in skin, the bowel and the eye.',
          terms: [
            {
              str: 'melanoma'
            },
            {
              str: 'malignant melanoma'
            },
            {
              str: 'Naevocarcinoma'
            }
          ],
          z: {
            dictAbbrev: 'RADLEX',
            cui: [
              'C0025202'
            ],
            tui: [
              'T191'
            ]
          }
        }
      ];

      res.should.deep.equal(expectedResult);
      cb();
    });

  });

  describe('mapBioPortalResToMatchObj', () => {

    it('properly maps BioPortal\'s returned JSON object to a VSM match' +
      'object', cb => {

      var res = dict.mapBioPortalResToMatchObj(
        JSON.parse(melanoma1resultJSONString), melanomaStr
      );
      var expectedResult = [
        {
          id:     'http://www.radlex.org/RID/#RID34617',
          dictID: 'http://data.bioontology.org/ontologies/RADLEX',
          str:    'melanoma',
          descr:  'A cell type cancer that has_material_basis_in abnormally proliferating cells derived_from melanocytes which are found in skin, the bowel and the eye.',
          type:   'S',
          terms: [
            {
              str: 'melanoma'
            },
            {
              str: 'malignant melanoma'
            },
            {
              str: 'Naevocarcinoma'
            }
          ],
          z: {
            dictAbbrev: 'RADLEX',
            cui: [
              'C0025202'
            ],
            tui: [
              'T191'
            ]
          }
        }
      ];

      res.should.deep.equal(expectedResult);
      cb();
    });

  });

  describe('splitDicts', () => {

    it('returns empty dictionaries when neither filter nor sort ' +
      'properties are given, they do not have arrays as values or ' +
      'they have empty arrays as values', cb => {
      var options1 = { page: 1 };
      var options2 = {
        filter: { dictID: 'any' },
        sort: { dictID: 345 }
      };
      var options3 = {
        filter: { dictID: [] },
        sort: { dictID: [] }
      };


      var res1 = dict.splitDicts(options1);
      var res2 = dict.splitDicts(options2);
      var res3 = dict.splitDicts(options3);
      var expectedResult = { pref: [], rest: [] };

      res1.should.deep.equal(expectedResult);
      res2.should.deep.equal(expectedResult);
      res3.should.deep.equal(expectedResult);
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

  describe('pruneCommonResultsById', () => {

    it('doesn\'t prune input map if it does not have 2 URLs', cb => {
      var urlToResultsMap = new Map();
      dict.pruneCommonResultsById(urlToResultsMap)
        .should.deep.equal(urlToResultsMap);

      var url1 = 'http://test/search?q=melanoma&ontologies=A&page=1&display_context=false';
      var res1 = [
        { id: 'id1', dictID: 'http://data.bioontology.org/ontologies/A' },
        { id: 'id2', dictID: 'http://data.bioontology.org/ontologies/A' }
      ];
      urlToResultsMap.set(url1, res1);

      dict.pruneCommonResultsById(urlToResultsMap)
        .should.deep.equal(urlToResultsMap);
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

      dict.pruneCommonResultsById(urlToResultsMap)
        .should.deep.equal(urlToResultsMap);
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

      var actualUrlToResultsMap = dict.pruneCommonResultsById(urlToResultsMap);
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

  describe('prepareDictInfoSearchURL', () => {

    it('returns proper url when ontologyAcronym is not defined or ' +
      'an empty string', cb => {
      var url1 = dict.prepareDictInfoSearchURL();
      var url2 = dict.prepareDictInfoSearchURL('');
      var expectedURL = testURLBase + '/ontologies/?display_context=false';

      url1.should.equal(expectedURL);
      url2.should.equal(expectedURL);
      cb();
    });

    it('returns proper url when ontologyAcronym is a string', cb => {
      var url = dict.prepareDictInfoSearchURL('GO');
      var expectedURL = testURLBase + '/ontologies/GO?display_context=false';

      url.should.equal(expectedURL);
      cb();
    });
  });

  describe('prepareMatchStringSearchURL', () => {

    it('returns proper url when ontologiesArray is empty', cb => {
      var url = dict.prepareMatchStringSearchURL(melanomaStr, {}, []);
      url.should.equal(testURLBase + '/search?q=melanoma&display_context=false');
      cb();
    });

    it('returns proper url when ontologiesArray is non-empty', cb => {
      var url = dict.prepareMatchStringSearchURL(melanomaStr, {}, ['A','B','C']);
      url.should.equal(testURLBase + '/search?q=melanoma&ontologies=A,B,C&display_context=false');
      cb();
    });

    it('returns proper url when the page property is not a number', cb => {
      var url = dict.prepareMatchStringSearchURL(melanomaStr, { page : 'String' }, []);
      url.should.equal(testURLBase + '/search?q=melanoma&display_context=false');
      cb();
    });

    it('returns proper url when the page property is a non-valid integer', cb => {
      var url = dict.prepareMatchStringSearchURL(melanomaStr, { page : 0 }, []);
      url.should.equal(testURLBase + '/search?q=melanoma&display_context=false');
      cb();
    });

    it('returns proper url when the page property is a valid integer', cb => {
      var url = dict.prepareMatchStringSearchURL(melanomaStr, { page : 2 }, ['A']);
      url.should.equal(testURLBase + '/search?q=melanoma&ontologies=A&page=2&display_context=false');
      cb();
    });

    it('returns proper url when the perPage property is not a number', cb => {
      var url = dict.prepareMatchStringSearchURL(melanomaStr, { perPage : ['Str'] }, []);
      url.should.equal(testURLBase + '/search?q=melanoma&display_context=false');
      cb();
    });

    it('returns proper url when the perPage property is a non-valid integer', cb => {
      var url = dict.prepareMatchStringSearchURL(
        melanomaStr, { perPage : 0 }, []);
      url.should.equal(testURLBase + '/search?q=melanoma&display_context=false');
      cb();
    });

    it('returns proper url when the perPage property is a valid integer', cb => {
      var url = dict.prepareMatchStringSearchURL(melanomaStr, { perPage : 1 }, ['A','B']);
      url.should.equal(testURLBase + '/search?q=melanoma&ontologies=A,B&pagesize=1&display_context=false');
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

  describe('getDictAcronymsFromArray', () => {

    it('returns empty array when given empty array', cb => {
      var res = dict.getDictAcronymsFromArray([]);
      res.should.deep.equal([]);
      cb();
    });

    it('returns proper dictionary acronyms/abbreviations when given ' +
      'a list of dictIDs', cb => {
      var dictIDs = [
        'http://data.bioontology.org/ontologies/CLO',
        'http://data.bioontology.org/ontologies/RH-MESH',
        'http://data.bioontology.org/ontologies/MCCL'
      ];

      var res = dict.getDictAcronymsFromArray(dictIDs);
      var expectedDictIDs = ['CLO', 'RH-MESH', 'MCCL'];
      res.should.deep.equal(expectedDictIDs);
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
