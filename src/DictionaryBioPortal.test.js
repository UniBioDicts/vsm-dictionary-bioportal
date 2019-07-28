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
  const dictNoApiKey =
    new DictionaryBioPortal({ baseURL: testURLBase });
  const dict =
    new DictionaryBioPortal({ baseURL: testURLBase, apiKey: apiKey, log: true });

  const noContext = '&display_context=false';
  const noContext2 = '?display_context=false';
  const melanomaStr = 'melanoma';
  const searchStr = '/search?q=';
  const propertySearchStr = '/property_search?q=';
  const noResultsStr = 'somethingThatDoesNotExist';
  const numberStr = '5';
  const refStr = 'it';

  const melanomaURL = searchStr + melanomaStr + noContext;
  const melanomaPropertyURL = propertySearchStr + melanomaStr + noContext;
  const melanomaURLWithFilteredDicts = searchStr + melanomaStr
    + '&ontologies=RADLEX,MCCL,VO' + noContext;
  const melanomaPropertyURLWithFilteredDicts = propertySearchStr + melanomaStr
    + '&ontologies=RADLEX,MCCL,VO' + noContext;
  const searchNumURL = searchStr + numberStr + noContext;
  const searchNumPropertyURL = propertySearchStr + numberStr + noContext;
  const searchRefURL = searchStr + refStr + noContext;
  const searchRefPropertyURL = propertySearchStr + refStr + noContext;
  const noResultsURL = searchStr + noResultsStr + noContext;
  const noResultsPropertyURL = propertySearchStr + noResultsStr + noContext;
  const searchGOontologyURL = '/ontologies/GO' + noContext2;
  const errorNonValidAcronymURL1 = '/search?q=a&ontologies=NonValidAcronym' + noContext;
  const errorNonValidAcronymURL1Property = '/property_search?q=a&ontologies=NonValidAcronym' + noContext;
  const errorNonValidAcronymURL2 = '/ontologies/nonValidAcronym' + noContext2;

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
    'resources', 'error_non_valid_acronym_1.json');
  const jsonError2Path = path.join(__dirname, '..',
    'resources', 'error_non_valid_acronym_2.json');

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
  const errorNonValidAcronymURL1JSONString =
    fs.readFileSync(jsonError1Path, 'utf8');
  const errorNonValidAcronymURL2JSONString =
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
  const testMatchObjArraySorted = [
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
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  after(() => {
    nock.enableNetConnect();
  });

  describe('getDictInfos', () => {
    it('returns empty result for non-valid ontology acronym', cb => {
      nock(testURLBase).get(errorNonValidAcronymURL2)
        .reply(404, errorNonValidAcronymURL2JSONString);
      dict.getDictInfos({ filter: {
        id : [testURLBase + '/ontologies/nonValidAcronym']
      }},(err, res) => {
        expect(err).to.be.null;
        res.items.should.deep.equal([]);
        cb();
      });
    });

    it('returns proper dictInfo object for the GO ontology', cb => {
      nock(testURLBase).get(searchGOontologyURL)
        .reply(200, goOntologyInfoJSONString);
      dict.getDictInfos({ filter: { id : [testURLBase + '/ontologies/GO']}},
        (err, res) => {
          expect(err).to.equal(null);
          res.should.deep.equal(
            { items: [
              {
                id:     'http://data.bioontology.org/ontologies/GO',
                abbrev: 'GO',
                name:   'Gene Ontology'
              }
            ]}
          );
          cb();
        });
    });
  });

  describe('getEntryMatchesForString', () => {
    it('calls its URL, with no apiKey given as an option', cb => {
      nock(testURLBase).get(melanomaURL)
        .reply(401, notValidAPIkeyJSONString);
      // to make the test pass, we give a 'no results' answer
      // to the property search query
      nock(testURLBase).get(melanomaPropertyURL)
        .reply(200, melanomaNoResultsJSONString);

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
      nock(testURLBase).get(errorNonValidAcronymURL1)
        .reply(404, errorNonValidAcronymURL1JSONString);
      // to make the test pass, we give a 'no results' answer
      // to the property search query
      nock(testURLBase).get(errorNonValidAcronymURL1Property)
        .reply(200, melanomaNoResultsJSONString);

      dict.getEntryMatchesForString('a', { filter: { dictID : [
        testURLBase + '/ontologies/NonValidAcronym'
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
      nock(testURLBase).get(noResultsURL)
        .reply(200, melanomaNoResultsJSONString);
      nock(testURLBase).get(noResultsPropertyURL)
        .reply(200, melanomaNoResultsJSONString);

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
      nock(testURLBase).get(melanomaURL)
        .reply(200, melanoma5resultsJSONString);
      // we hypothesize that the property search returned no results
      nock(testURLBase).get(melanomaPropertyURL)
        .reply(200, melanomaNoResultsJSONString);

      dict.getEntryMatchesForString(melanomaStr, {}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({ items: matchObjArray });
        cb();
      });
    });

    it('calls its URL, with a test url+apiKey and options ' +
      'for filtering and z-pruning the results and returns proper ' +
      'vsm match objects', cb => {
      nock(testURLBase).get(melanomaURLWithFilteredDicts)
        .reply(200, melanoma3resultsJSONString);
      // we hypothesize that the property search returned no results
      nock(testURLBase).get(melanomaPropertyURLWithFilteredDicts)
        .reply(200, melanomaNoResultsJSONString);

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
      nock(testURLBase).get(melanomaURLWithFilteredDicts)
        .reply(200, melanoma3resultsJSONString);
      nock(testURLBase).get(melanomaURL)
        .reply(200, melanoma5resultsJSONString);
      // we hypothesize that the property search queries returned no results
      nock(testURLBase).get(melanomaPropertyURLWithFilteredDicts)
        .reply(200, melanomaNoResultsJSONString);
      nock(testURLBase).get(melanomaPropertyURL)
        .reply(200, melanomaNoResultsJSONString);

      // manually build the result array of objects
      const expectedFilteredResult = JSON.parse(
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
      // we hypothesize that the BioPortal server sends empty results
      nock(testURLBase).get(searchNumURL)
        .reply(200, melanomaNoResultsJSONString);
      nock(testURLBase).get(searchNumPropertyURL)
        .reply(200, melanomaNoResultsJSONString);

      dict.getMatchesForString(numberStr, {}, (err, res) => {
        res.should.deep.equal(
          {
            items: [{ id:'00:5e+0', dictID:'00', str:'5', descr:'number', type:'N' }]
          });
        cb();
      });
    });

    it('lets the parent class add a default refTerm match', cb => {
      // we hypothesize that the BioPortal server sends empty results
      nock(testURLBase).get(searchRefURL)
        .reply(200, melanomaNoResultsJSONString);
      nock(testURLBase).get(searchRefPropertyURL)
        .reply(200, melanomaNoResultsJSONString);

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
    it('returns one global URL if there is no proper `filter.id` array ' +
      'of dictIDs', cb => {
      const options1 = {
        page: 2
      };
      const options2 = {
        filter: {},
        page: 1
      };
      const options3 = {
        filter: { dict: {} }
      };
      const options4 = {
        filter: { id: 'any' }
      };
      const options5 = {
        filter: { id: [] }
      };
      const options6 = {};
      const options7 = {
        filter: { id : ['', ' ']}
      };

      const res1 = dict.buildDictInfoURLs(options1);
      const res2 = dict.buildDictInfoURLs(options2);
      const res3 = dict.buildDictInfoURLs(options3);
      const res4 = dict.buildDictInfoURLs(options4);
      const res5 = dict.buildDictInfoURLs(options5);
      const res6 = dict.buildDictInfoURLs(options6);
      const res7 = dict.buildDictInfoURLs(options7);
      const expectedResult = [testURLBase + '/ontologies/?display_context=false'];

      res1.should.deep.equal(expectedResult);
      res2.should.deep.equal(expectedResult);
      res3.should.deep.equal(expectedResult);
      res4.should.deep.equal(expectedResult);
      res5.should.deep.equal(expectedResult);
      res6.should.deep.equal(expectedResult);
      res7.should.deep.equal(expectedResult);

      cb();
    });

    it('returns an array of URLs corresponding to the ontologies ' +
      'that were taken from the `filter.id` array ', cb => {
      const options1 = {
        filter: { id: [
          'http://data.bioontology.org/ontologies/CLO',
          'http://data.bioontology.org/ontologies/RH-MESH',
          'http://data.bioontology.org/ontologies/MCCL'
        ]},
        page: 2,
        perPage: 2
      };
      const options2 = {
        filter: { id: [
          'http://data.bioontology.org/ontologies/GO',
        ]}
      };
      const res1 = dict.buildDictInfoURLs(options1);
      const res2 = dict.buildDictInfoURLs(options2);

      const expectedResult1 = [
        testURLBase + '/ontologies/CLO?display_context=false',
        testURLBase + '/ontologies/RH-MESH?display_context=false',
        testURLBase + '/ontologies/MCCL?display_context=false'
      ];
      const expectedResult2 = [
        testURLBase + '/ontologies/GO?display_context=false'
      ];

      res1.should.deep.equal(expectedResult1);
      res2.should.deep.equal(expectedResult2);

      cb();
    });
  });

  describe('buildEntryURLs', () => {
    it('returns one URL asking for all entry objects if options is empty or ' +
      'both `filter.id` and `filter.dictID` are not in proper format', cb => {
      const options1 = {};
      const options2 = { filter: {}, sort: 'id' };
      const options3 = { filter: { id: [], dictID: '' }, sort: '', page: 1,
        perPage: 10 };

      const res1 = dict.buildEntryURLs(options1);
      const res2 = dict.buildEntryURLs(options2);
      const res3 = dict.buildEntryURLs(options3);
      options3.page = 2;
      const res4 = dict.buildEntryURLs(options3);

      const expectedResult1 = [
        testURLBase + '/search?ontologies=&ontology_types=ONTOLOGY&display_context=false'
      ];
      const expectedResult2 = expectedResult1;
      const expectedResult3 = [
        testURLBase + '/search?ontologies=&ontology_types=ONTOLOGY&page=1&pagesize=10&display_context=false'
      ];
      // no matter the page number, you still get one URL
      const expectedResult4 = [
        testURLBase + '/search?ontologies=&ontology_types=ONTOLOGY&page=2&pagesize=10&display_context=false'
      ];

      res1.should.deep.equal(expectedResult1);
      res2.should.deep.equal(expectedResult2);
      res3.should.deep.equal(expectedResult3);
      res4.should.deep.equal(expectedResult4);

      cb();
    });

    it('returns one URL asking for specific entry objects when the ' +
      '`filter.dictID` is in proper format and `filter.id` is not', cb => {
      const options1 = {
        filter: {
          id: [],
          dictID: [
            'http://data.bioontology.org/ontologies/GO',
            'http://data.bioontology.org/ontologies/RADLEX',
            'http://data.bioontology.org/ontologies/PO'
          ]},
        sort: 'id'
      };

      const options2 = {
        filter: {
          dictID: [
            'http://data.bioontology.org/ontologies/GO'
          ]},
        page: 1,
        perPage: 10
      };

      const options3 = {
        filter: {
          dictID: [
            'http://data.bioontology.org/ontologies/GO',
            'http://data.bioontology.org/ontologies/RADLEX',
            'http://data.bioontology.org/ontologies/PO'
          ]},
        page: 2,
        perPage: 10
      };

      const res1 = dict.buildEntryURLs(options1);
      const res2 = dict.buildEntryURLs(options2);
      const res3 = dict.buildEntryURLs(options3);

      const expectedResult1 = [
        testURLBase + '/search?ontologies=GO,RADLEX,PO&ontology_types=ONTOLOGY&display_context=false'
      ];
      const expectedResult2 = [
        testURLBase + '/search?ontologies=GO&ontology_types=ONTOLOGY&page=1&pagesize=10&display_context=false'
      ];
      // no matter the page number, you still get one URL
      const expectedResult3 = [
        testURLBase + '/search?ontologies=GO,RADLEX,PO&ontology_types=ONTOLOGY&page=2&pagesize=10&display_context=false'
      ];

      res1.should.deep.equal(expectedResult1);
      res2.should.deep.equal(expectedResult2);
      res3.should.deep.equal(expectedResult3);

      cb();
    });

    it('returns proper URLs asking for specific entry objects when ' +
      'the `filter.id` is in proper format and `filter.dictID` is not', cb => {
      const options1 = {
        filter: {
          id: [
            'http://purl.bioontology.org/ontology/MEDDRA/10053571',
            'http://purl.bioontology.org/ontology/LNC/LA14279-6'
          ],
          dictID: []
        }
      };

      const options2 = {
        filter: {
          id: ['http://purl.bioontology.org/ontology/MEDDRA/10053571']
        },
        sort: 'id',
        page: 1,
        perPage: 10
      };

      const res1 = dict.buildEntryURLs(options1);
      const res2 = dict.buildEntryURLs(options2);
      options2.page = 2;
      const res3 = dict.buildEntryURLs(options2);

      const expectedResult1 = [
        testURLBase + '/search?q=http%3A%2F%2Fpurl.bioontology.org%2Fontology%2FMEDDRA%2F10053571&ontologies=&require_exact_match=true&also_search_obsolete=true&display_context=false',
        testURLBase + '/property_search?q=http%3A%2F%2Fpurl.bioontology.org%2Fontology%2FMEDDRA%2F10053571&ontologies=&require_exact_match=true&display_context=false',
        testURLBase + '/search?q=http%3A%2F%2Fpurl.bioontology.org%2Fontology%2FLNC%2FLA14279-6&ontologies=&require_exact_match=true&also_search_obsolete=true&display_context=false',
        testURLBase + '/property_search?q=http%3A%2F%2Fpurl.bioontology.org%2Fontology%2FLNC%2FLA14279-6&ontologies=&require_exact_match=true&display_context=false'
      ];
      const expectedResult2 = [
        testURLBase + '/search?q=http%3A%2F%2Fpurl.bioontology.org%2Fontology%2FMEDDRA%2F10053571&ontologies=&require_exact_match=true&also_search_obsolete=true&page=1&pagesize=10&display_context=false',
        testURLBase + '/property_search?q=http%3A%2F%2Fpurl.bioontology.org%2Fontology%2FMEDDRA%2F10053571&ontologies=&require_exact_match=true&page=1&pagesize=10&display_context=false'
      ];
      const expectedResult3 = [
        testURLBase + '/search?q=http%3A%2F%2Fpurl.bioontology.org%2Fontology%2FMEDDRA%2F10053571&ontologies=&require_exact_match=true&also_search_obsolete=true&page=2&pagesize=10&display_context=false',
        testURLBase + '/property_search?q=http%3A%2F%2Fpurl.bioontology.org%2Fontology%2FMEDDRA%2F10053571&ontologies=&require_exact_match=true&page=2&pagesize=10&display_context=false'
      ];

      res1.should.deep.equal(expectedResult1);
      res2.should.deep.equal(expectedResult2);
      res3.should.deep.equal(expectedResult3);
      cb();
    });

    it('returns proper URLs asking for specific entry objects when ' +
      'both the `filter.id` and the `filter.dictID` are in proper format', cb => {
      const options = {
        filter: {
          id: [
            'http://purl.obolibrary.org/obo/BFO_0000002',
            'http://purl.bioontology.org/ontology/LNC/LA14279-6'
          ],
          dictID: [
            'http://data.bioontology.org/ontologies/OGMS',
            'http://data.bioontology.org/ontologies/LOINC'
          ]
        },
        sort: 'id',
        page: 1,
        perPage: 4
      };

      const res1 = dict.buildEntryURLs(options);
      const expectedResult1 = [
        testURLBase + '/search?q=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2FBFO_0000002&ontologies=OGMS,LOINC&require_exact_match=true&also_search_obsolete=true&page=1&pagesize=4&display_context=false',
        testURLBase + '/property_search?q=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2FBFO_0000002&ontologies=OGMS,LOINC&require_exact_match=true&page=1&pagesize=4&display_context=false',
        testURLBase + '/search?q=http%3A%2F%2Fpurl.bioontology.org%2Fontology%2FLNC%2FLA14279-6&ontologies=OGMS,LOINC&require_exact_match=true&also_search_obsolete=true&page=1&pagesize=4&display_context=false',
        testURLBase + '/property_search?q=http%3A%2F%2Fpurl.bioontology.org%2Fontology%2FLNC%2FLA14279-6&ontologies=OGMS,LOINC&require_exact_match=true&page=1&pagesize=4&display_context=false'
      ];

      options.page = 2;
      const res2 = dict.buildEntryURLs(options);
      const expectedResult2 = [
        testURLBase + '/search?q=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2FBFO_0000002&ontologies=OGMS,LOINC&require_exact_match=true&also_search_obsolete=true&page=2&pagesize=4&display_context=false',
        testURLBase + '/property_search?q=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2FBFO_0000002&ontologies=OGMS,LOINC&require_exact_match=true&page=2&pagesize=4&display_context=false',
        testURLBase + '/search?q=http%3A%2F%2Fpurl.bioontology.org%2Fontology%2FLNC%2FLA14279-6&ontologies=OGMS,LOINC&require_exact_match=true&also_search_obsolete=true&page=2&pagesize=4&display_context=false',
        testURLBase + '/property_search?q=http%3A%2F%2Fpurl.bioontology.org%2Fontology%2FLNC%2FLA14279-6&ontologies=OGMS,LOINC&require_exact_match=true&page=2&pagesize=4&display_context=false'
      ];

      res1.should.deep.equal(expectedResult1);
      res2.should.deep.equal(expectedResult2);

      cb();
    });
  });

  describe('buildMatchURLs', () => {
    it('returns two URLs when there is neither `options.filter` and ' +
      '`options.sort` given, no matter the page asked', cb => {
      const options = {
        filter: { dictID : [] },
        sort: { dictID : [] },
        z: true,
        page: 1,
        perPage: 20
      };

      const res1 = dict.buildMatchURLs(melanomaStr, options);
      const expectedResult1 = [
        testURLBase + '/search?q=melanoma&page=1&pagesize=20&display_context=false',
        testURLBase + '/property_search?q=melanoma&page=1&pagesize=20&display_context=false'
      ];

      options.page = 20;
      const res2 = dict.buildMatchURLs(melanomaStr, options);
      const expectedResult2 = [
        testURLBase + '/search?q=melanoma&page=20&pagesize=20&display_context=false',
        testURLBase + '/property_search?q=melanoma&page=20&pagesize=20&display_context=false'
      ];

      res1.should.deep.equal(expectedResult1);
      res2.should.deep.equal(expectedResult2);
      cb();
    });

    it('returns two URLs when `options.filter` is given but no ' +
      '`options.sort`', cb => {
      const options = {
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

      const res1 = dict.buildMatchURLs(melanomaStr, options);
      const expectedResult1 = [
        testURLBase + '/search?q=melanoma&ontologies=A,B,C&page=1&pagesize=20&display_context=false',
        testURLBase + '/property_search?q=melanoma&ontologies=A,B,C&page=1&pagesize=20&display_context=false'
      ];

      options.page = 20;
      const res2 = dict.buildMatchURLs(melanomaStr, options);
      const expectedResult2 = [
        testURLBase + '/search?q=melanoma&ontologies=A,B,C&page=20&pagesize=20&display_context=false',
        testURLBase + '/property_search?q=melanoma&ontologies=A,B,C&page=20&pagesize=20&display_context=false'
      ];

      res1.should.deep.equal(expectedResult1);
      res2.should.deep.equal(expectedResult2);
      cb();
    });

    it('returns proper URLs when `options.sort` is given but no ' +
      '`options.filter`, based on the `options.page` value', cb => {
      const options = {
        filter: { dictID : [] },
        sort: { dictID : [
          'http://test/ontologies/A',
          'http://test/ontologies/B',
          'http://test/ontologies/C'
        ]},
        z: true,
        page: 1
      };

      const res1 = dict.buildMatchURLs(melanomaStr, options);
      const expectedResult1 = [
        testURLBase + '/search?q=melanoma&ontologies=A,B,C&page=1&display_context=false',
        testURLBase + '/property_search?q=melanoma&ontologies=A,B,C&page=1&display_context=false',
        testURLBase + '/search?q=melanoma&page=1&display_context=false',
        testURLBase + '/property_search?q=melanoma&page=1&display_context=false'
      ];

      options.page = 2;
      const res2 = dict.buildMatchURLs(melanomaStr, options);
      const expectedResult2 = [
        testURLBase + '/search?q=melanoma&page=2&display_context=false',
        testURLBase + '/property_search?q=melanoma&page=2&display_context=false'
      ];

      delete options.page;
      const res3 = dict.buildMatchURLs(melanomaStr, options);
      const expectedResult3 = [
        testURLBase + '/search?q=melanoma&ontologies=A,B,C&display_context=false',
        testURLBase + '/property_search?q=melanoma&ontologies=A,B,C&display_context=false',
        testURLBase + '/search?q=melanoma&display_context=false',
        testURLBase + '/property_search?q=melanoma&display_context=false'
      ];

      res1.should.deep.equal(expectedResult1);
      res2.should.deep.equal(expectedResult2);
      res3.should.deep.equal(expectedResult3);
      cb();
    });

    it('returns proper URLs when both `options.sort` and `options.filter` ' +
      'are given, based on the `options.page` value', cb => {
      const options = {
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
      const res1 = dict.buildMatchURLs(melanomaStr, options);
      const expectedResult1 = [
        testURLBase + '/search?q=melanoma&ontologies=A&page=1&pagesize=20&display_context=false',
        testURLBase + '/property_search?q=melanoma&ontologies=A&page=1&pagesize=20&display_context=false',
        testURLBase + '/search?q=melanoma&ontologies=B,C&page=1&pagesize=20&display_context=false',
        testURLBase + '/property_search?q=melanoma&ontologies=B,C&page=1&pagesize=20&display_context=false'
      ];

      // filter.dictID = {A,B,C}, sort.dictID = {A,C}, no page
      options.sort.dictID.push('http://test/ontologies/C');
      delete options.page;
      options.perPage = 10;
      const res2 = dict.buildMatchURLs(melanomaStr, options);
      const expectedResult2 = [
        testURLBase + '/search?q=melanoma&ontologies=A,C&pagesize=10&display_context=false',
        testURLBase + '/property_search?q=melanoma&ontologies=A,C&pagesize=10&display_context=false',
        testURLBase + '/search?q=melanoma&ontologies=B&pagesize=10&display_context=false',
        testURLBase + '/property_search?q=melanoma&ontologies=B&pagesize=10&display_context=false'
      ];

      // filter.dictID = {A,B,C,D}, sort.dictID = {A,C}, page = 2
      options.filter.dictID.push('http://test/ontologies/D');
      options.page = 2;
      const res3 = dict.buildMatchURLs(melanomaStr, options);
      const expectedResult3 = [
        testURLBase + '/search?q=melanoma&ontologies=A,C,B,D&page=2&pagesize=10&display_context=false',
        testURLBase + '/property_search?q=melanoma&ontologies=A,C,B,D&page=2&pagesize=10&display_context=false'
      ];

      // filter.dictID = {A,B}, sort.dictID = {A,C}, page = 2
      options.filter.dictID = options.filter.dictID.splice(0,2);
      const res4 = dict.buildMatchURLs(melanomaStr, options);
      const expectedResult4 = [
        testURLBase + '/search?q=melanoma&ontologies=A,B&page=2&pagesize=10&display_context=false',
        testURLBase + '/property_search?q=melanoma&ontologies=A,B&page=2&pagesize=10&display_context=false'
      ];

      // filter.dictID = {A,B,F}, sort.dictID = {A,C}, page = 3
      options.filter.dictID.push('http://test/ontologies/F');
      options.page = 3;
      const res5 = dict.buildMatchURLs(melanomaStr, options);
      const expectedResult5 = [
        testURLBase + '/search?q=melanoma&ontologies=A,B,F&page=3&pagesize=10&display_context=false',
        testURLBase + '/property_search?q=melanoma&ontologies=A,B,F&page=3&pagesize=10&display_context=false'
      ];

      // filter.dictID = {A,B,F}, sort.dictID = {A,C}, no page
      delete options.page;
      const res6 = dict.buildMatchURLs(melanomaStr, options);
      const expectedResult6 = [
        testURLBase + '/search?q=melanoma&ontologies=A&pagesize=10&display_context=false',
        testURLBase + '/property_search?q=melanoma&ontologies=A&pagesize=10&display_context=false',
        testURLBase + '/search?q=melanoma&ontologies=B,F&pagesize=10&display_context=false',
        testURLBase + '/property_search?q=melanoma&ontologies=B,F&pagesize=10&display_context=false'
      ];

      // filter.dictID = {A,B,F}, sort.dictID = {A,B,F}, no page
      options.sort.dictID.pop();
      options.sort.dictID.push('http://test/ontologies/B');
      options.sort.dictID.push('http://test/ontologies/F');
      const res7 = dict.buildMatchURLs(melanomaStr, options);
      const expectedResult7 = [
        testURLBase + '/search?q=melanoma&ontologies=A,B,F&pagesize=10&display_context=false',
        testURLBase + '/property_search?q=melanoma&ontologies=A,B,F&pagesize=10&display_context=false'
      ];

      options.page = 20;
      const res8 = dict.buildMatchURLs(melanomaStr, options);
      const expectedResult8 = [
        testURLBase + '/search?q=melanoma&ontologies=A,B,F&page=20&pagesize=10&display_context=false',
        testURLBase + '/property_search?q=melanoma&ontologies=A,B,F&page=20&pagesize=10&display_context=false'
      ];

      // filter.dictID = {A,B,F}, sort.dictID = {A,B,F,G}, page 20
      options.sort.dictID.push('http://test/ontologies/G');
      const res9 = dict.buildMatchURLs(melanomaStr, options);

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
    it('returns empty dictionaries when neither filter nor sort ' +
      'properties are given, they do not have arrays as values or ' +
      'they have empty arrays as values', cb => {
      const options1 = { page: 1 };
      const options2 = {
        filter: { dictID: 'any' },
        sort: { dictID: 345 }
      };
      const options3 = {
        filter: { dictID: [] },
        sort: { dictID: [] }
      };


      const res1 = dict.splitDicts(options1);
      const res2 = dict.splitDicts(options2);
      const res3 = dict.splitDicts(options3);
      const expectedResult = { pref: [], rest: [] };

      res1.should.deep.equal(expectedResult);
      res2.should.deep.equal(expectedResult);
      res3.should.deep.equal(expectedResult);
      cb();
    });

    it('splits dictionaries properly when no or empty sort property is given', cb => {
      const options1 = {
        filter: { dictID: ['a','b'] },
        page: 3
      };

      const options2 = {
        filter: { dictID: ['a','b'] } ,
        sort: { dictID: [] }
      };

      const expectedResult = {
        pref: [],
        rest: ['a','b']
      };

      const res1 = dict.splitDicts(options1);
      const res2 = dict.splitDicts(options2);

      res1.should.deep.equal(expectedResult);
      res2.should.deep.equal(expectedResult);
      cb();
    });

    it('splits dictionaries properly when no or empty filter property is given', cb => {
      const options1 = {
        sort: { dictID: ['d','e'] },
        page: 3
      };

      const options2 = {
        filter: { dictID: [] },
        sort: { dictID: ['d','e'] }
      };

      const expectedResult = {
        pref: ['d','e'],
        rest: []
      };

      const res1 = dict.splitDicts(options1);
      const res2 = dict.splitDicts(options2);

      res1.should.deep.equal(expectedResult);
      res2.should.deep.equal(expectedResult);
      cb();
    });

    it('splits dictionaries properly when both filter and sort ' +
      'properties are given ', cb => {
      const options1 = {
        filter: { dictID: ['a','b','c','d'] },
        sort: { dictID: ['a','c'] }
      };

      const expectedResult1 = {
        pref: ['a','c'],
        rest: ['b','d']
      };

      const options2 = {
        filter: { dictID: ['a','b','c','d'] },
        sort: { dictID: ['e','b'] }
      };

      const expectedResult2 = {
        pref: ['b'],
        rest: ['a','c','d']
      };

      const options3 = {
        filter: { dictID: ['a','b','c','d'] },
        sort: { dictID: ['e','f'] }
      };

      const expectedResult3 = {
        pref: [],
        rest: ['a','b','c','d']
      };

      const options4 = {
        filter: { dictID: ['e','b'] },
        sort: { dictID: ['e','b'] }
      };

      const expectedResult4 = {
        pref: [],
        rest: ['e','b']
      };

      const options5 = {
        filter: { dictID: ['a','b'] },
        sort: { dictID: ['a','b','c','d'] }
      };

      const expectedResult5 = {
        pref: [],
        rest: ['a','b']
      };

      const options6 = {
        filter: { dictID: ['e','f'] },
        sort: { dictID: ['a','b','c','d'] }
      };

      const expectedResult6 = {
        pref: [],
        rest: ['e','f']
      };

      const res1 = dict.splitDicts(options1);
      const res2 = dict.splitDicts(options2);
      const res3 = dict.splitDicts(options3);
      const res4 = dict.splitDicts(options4);
      const res5 = dict.splitDicts(options5);
      const res6 = dict.splitDicts(options6);

      res1.should.deep.equal(expectedResult1);
      res2.should.deep.equal(expectedResult2);
      res3.should.deep.equal(expectedResult3);
      res4.should.deep.equal(expectedResult4);
      res5.should.deep.equal(expectedResult5);
      res6.should.deep.equal(expectedResult6);

      cb();
    });
  });

  describe('mapBioPortalResToDictInfoObj', () => {
    it('properly maps BioPortal\'s returned JSON object to a VSM dictInfo' +
      'object', cb => {

      const res1 = dict.mapBioPortalResToDictInfoObj(
        JSON.parse(goOntologyInfoJSONString)
      );
      const res2 = dict.mapBioPortalResToDictInfoObj(
        JSON.parse(threeOntologiesInfoJSONString)
      );

      const expectedResult1 = [
        {
          id:     'http://data.bioontology.org/ontologies/GO',
          abbrev: 'GO',
          name:   'Gene Ontology'
        }
      ];
      const expectedResult2 = [
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

  describe('mapBioPortalSearchResToEntryObj', () => {
    it('properly maps BioPortal\'s returned JSON object to a VSM entry' +
      'object', cb => {
      // options with no proper `filter.id` proper
      const options = {
        filter: {
          id: []
        }
      };

      const res1 = dict.mapBioPortalSearchResToEntryObj(
        JSON.parse(melanoma1resultJSONString), options);
      const expectedResult = [
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

      res1.should.deep.equal(expectedResult);

      // when quering for an `id`, `z.obsolete` should appear in the result
      options.filter.id = ['http://www.radlex.org/RID/#RID34617'];
      const res2 = dict.mapBioPortalSearchResToEntryObj(
        JSON.parse(melanoma1resultJSONString), options);
      expectedResult[0].z.obsolete = false;

      res2.should.deep.equal(expectedResult);

      cb();
    });
  });

  describe('mapBioPortalSearchResToMatchObj', () => {
    it('properly maps BioPortal\'s returned JSON object to a VSM match' +
      'object', cb => {

      const res = dict.mapBioPortalSearchResToMatchObj(
        JSON.parse(melanoma1resultJSONString), melanomaStr
      );
      const expectedResult = [
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

  describe('getDictAcronymsFromArray', () => {
    it('returns empty array when given empty array', cb => {
      const res = dict.getDictAcronymsFromArray([]);
      res.should.deep.equal([]);
      cb();
    });

    it('returns proper dictionary acronyms/abbreviations when given ' +
      'a list of dictIDs', cb => {
      const dictIDs = [
        'http://data.bioontology.org/ontologies/CLO',
        'http://data.bioontology.org/ontologies/RH-MESH',
        'http://data.bioontology.org/ontologies/MCCL'
      ];

      const res = dict.getDictAcronymsFromArray(dictIDs);
      const expectedDictIDs = ['CLO', 'RH-MESH', 'MCCL'];
      res.should.deep.equal(expectedDictIDs);
      cb();
    });
  });

  describe('prepareDictInfoSearchURL', () => {
    it('returns proper url when ontologyAcronym is not defined or ' +
      'an empty string', cb => {
      const url1 = dict.prepareDictInfoSearchURL();
      const url2 = dict.prepareDictInfoSearchURL('');
      const expectedURL = testURLBase + '/ontologies/?display_context=false';

      url1.should.equal(expectedURL);
      url2.should.equal(expectedURL);
      cb();
    });

    it('returns proper url when ontologyAcronym is a string', cb => {
      const url = dict.prepareDictInfoSearchURL('GO');
      const expectedURL = testURLBase + '/ontologies/GO?display_context=false';

      url.should.equal(expectedURL);
      cb();
    });
  });

  describe('prepareEntrySearchURLs', () => {
    it('returns proper URL(s) according to 4 of the possible input ' +
      'combinations that are used by buildEntryURLs()', cb => {
      const url1 = dict.prepareEntrySearchURLs({ page: 1, perPage: 2 }, '', []);
      const url2 = dict.prepareEntrySearchURLs({}, '', ['NCIT','GO']);
      const url3 = dict.prepareEntrySearchURLs({},
        'http://purl.obolibrary.org/obo/DOID_1909', []);
      const url4 = dict.prepareEntrySearchURLs({ page: 1, perPage: 2 },
        'http://purl.obolibrary.org/obo/DOID_1909', ['BAO','DOID']);

      const expectedURL1 = [
        testURLBase + '/search?ontologies=&ontology_types=ONTOLOGY&page=1&pagesize=2&display_context=false'
      ];
      const expectedURL2 = [
        testURLBase + '/search?ontologies=NCIT,GO&ontology_types=ONTOLOGY&display_context=false'
      ];
      const expectedURL3 = [
        testURLBase + '/search?q=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2FDOID_1909&ontologies=&require_exact_match=true&also_search_obsolete=true&display_context=false',
        testURLBase + '/property_search?q=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2FDOID_1909&ontologies=&require_exact_match=true&display_context=false'
      ];
      const expectedURL4 = [
        testURLBase + '/search?q=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2FDOID_1909&ontologies=BAO,DOID&require_exact_match=true&also_search_obsolete=true&page=1&pagesize=2&display_context=false',
        testURLBase + '/property_search?q=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2FDOID_1909&ontologies=BAO,DOID&require_exact_match=true&page=1&pagesize=2&display_context=false'
      ];

      url1.should.deep.equal(expectedURL1);
      url2.should.deep.equal(expectedURL2);
      url3.should.deep.equal(expectedURL3);
      url4.should.deep.equal(expectedURL4);

      cb();
    });
  });

  describe('prepareMatchStringSearchURL', () => {
    it('returns proper url when ontologiesArray is empty', cb => {
      const url = dict.prepareMatchStringSearchURL(melanomaStr, {}, []);
      const expectedURL = [
        testURLBase + '/search?q=melanoma&display_context=false',
        testURLBase + '/property_search?q=melanoma&display_context=false'
      ];

      url.should.deep.equal(expectedURL);
      cb();
    });

    it('returns proper url when ontologiesArray is non-empty', cb => {
      const url = dict.prepareMatchStringSearchURL(melanomaStr, {}, ['A','B','C']);
      const expectedURL = [
        testURLBase + '/search?q=melanoma&ontologies=A,B,C&display_context=false',
        testURLBase + '/property_search?q=melanoma&ontologies=A,B,C&display_context=false'
      ];

      url.should.deep.equal(expectedURL);
      cb();
    });

    it('returns proper url when the page property is not a number', cb => {
      const url = dict.prepareMatchStringSearchURL(melanomaStr, { page : 'String' }, []);
      const expectedURL = [
        testURLBase + '/search?q=melanoma&display_context=false',
        testURLBase + '/property_search?q=melanoma&display_context=false'
      ];

      url.should.deep.equal(expectedURL);
      cb();
    });

    it('returns proper url when the page property is a non-valid integer', cb => {
      const url = dict.prepareMatchStringSearchURL(melanomaStr, { page : 0 }, []);
      const expectedURL = [
        testURLBase + '/search?q=melanoma&display_context=false',
        testURLBase + '/property_search?q=melanoma&display_context=false'
      ];

      url.should.deep.equal(expectedURL);
      cb();
    });

    it('returns proper url when the page property is a valid integer', cb => {
      const url = dict.prepareMatchStringSearchURL(melanomaStr, { page : 2 }, ['A']);
      const expectedURL = [
        testURLBase + '/search?q=melanoma&ontologies=A&page=2&display_context=false',
        testURLBase + '/property_search?q=melanoma&ontologies=A&page=2&display_context=false'
      ];

      url.should.deep.equal(expectedURL);
      cb();
    });

    it('returns proper url when the perPage property is not a number', cb => {
      const url = dict.prepareMatchStringSearchURL(melanomaStr, { perPage : ['Str'] }, []);
      const expectedURL = [
        testURLBase + '/search?q=melanoma&display_context=false',
        testURLBase + '/property_search?q=melanoma&display_context=false'
      ];

      url.should.deep.equal(expectedURL);
      cb();
    });

    it('returns proper url when the perPage property is a non-valid integer', cb => {
      const url = dict.prepareMatchStringSearchURL(
        melanomaStr, { perPage : 0 }, []);
      const expectedURL = [
        testURLBase + '/search?q=melanoma&display_context=false',
        testURLBase + '/property_search?q=melanoma&display_context=false'
      ];

      url.should.deep.equal(expectedURL);
      cb();
    });

    it('returns proper url when the perPage property is a valid integer', cb => {
      const url = dict.prepareMatchStringSearchURL(melanomaStr, { perPage : 1 }, ['A','B']);
      const expectedURL = [
        testURLBase + '/search?q=melanoma&ontologies=A,B&pagesize=1&display_context=false',
        testURLBase + '/property_search?q=melanoma&ontologies=A,B&pagesize=1&display_context=false'
      ];

      url.should.deep.equal(expectedURL);
      cb();
    });
  });

  describe('pruneCommonResultsById', () => {
    it('doesn\'t prune input map if it does not have 4 URLs', cb => {
      const urlToResultsMap = new Map();
      dict.pruneCommonResultsById(urlToResultsMap)
        .should.deep.equal(urlToResultsMap);

      const url1 = testURLBase + '/search?q=melanoma&ontologies=A&page=1&display_context=false';
      const res1 = [
        { id: 'id1', dictID: 'http://data.bioontology.org/ontologies/A' },
        { id: 'id2', dictID: 'http://data.bioontology.org/ontologies/A' }
      ];
      urlToResultsMap.set(url1, res1);

      dict.pruneCommonResultsById(urlToResultsMap)
        .should.deep.equal(urlToResultsMap);
      cb();
    });

    it('doesn\'t prune input map if there are no common results', cb => {
      const urlToResultsMap = new Map();

      const url1 = testURLBase + '/search?q=melanoma&ontologies=A&page=1&display_context=false';
      const url2 = testURLBase + '/property_search?q=melanoma&ontologies=A&page=1&display_context=false';
      const url3 = testURLBase + '/search?q=melanoma&ontologies=B&page=1&display_context=false';
      const url4 = testURLBase + '/property_search?q=melanoma&ontologies=B&page=1&display_context=false';

      const res1 = [
        { id: 'id1', dictID: 'http://data.bioontology.org/ontologies/A' },
        { id: 'id2', dictID: 'http://data.bioontology.org/ontologies/A' }
      ];
      const res2 = [
        { id: 'id3', dictID: 'http://data.bioontology.org/ontologies/A' },
        { id: 'id4', dictID: 'http://data.bioontology.org/ontologies/A' }
      ];
      const res3 = [
        { id: 'id5', dictID: 'http://data.bioontology.org/ontologies/B' },
        { id: 'id6', dictID: 'http://data.bioontology.org/ontologies/B' }
      ];
      const res4 = [
        { id: 'id7', dictID: 'http://data.bioontology.org/ontologies/B' },
        { id: 'id8', dictID: 'http://data.bioontology.org/ontologies/B' }
      ];

      urlToResultsMap.set(url1, res1);
      urlToResultsMap.set(url2, res2);
      urlToResultsMap.set(url3, res3);
      urlToResultsMap.set(url4, res4);

      dict.pruneCommonResultsById(urlToResultsMap)
        .should.deep.equal(urlToResultsMap);
      cb();
    });

    it('correctly prunes input map when there are common results', cb => {
      const urlToResultsMap = new Map();
      const url1 = testURLBase + '/search?q=melanoma&ontologies=A&page=1&display_context=false';
      const url2 = testURLBase + '/property_search?q=melanoma&ontologies=A&page=1&display_context=false';
      const url3 = testURLBase + '/search?q=melanoma&page=1&display_context=false';
      const url4 = testURLBase + '/property_search?q=melanoma&page=1&display_context=false';

      const res1 = [
        { id: 'id1', dictID: 'http://data.bioontology.org/ontologies/A' },
        { id: 'id2', dictID: 'http://data.bioontology.org/ontologies/A' },
        { id: 'id3', dictID: 'http://data.bioontology.org/ontologies/A' }
      ];
      const res2 = [
        { id: 'id5', dictID: 'http://data.bioontology.org/ontologies/A' },
        { id: 'id6', dictID: 'http://data.bioontology.org/ontologies/A' },
        { id: 'id7', dictID: 'http://data.bioontology.org/ontologies/A' }
      ];
      const res3 = [
        { id: 'id2', dictID: 'http://data.bioontology.org/ontologies/B' },
        { id: 'id1', dictID: 'http://data.bioontology.org/ontologies/C' },
        { id: 'id4', dictID: 'http://data.bioontology.org/ontologies/D' }
      ];
      const res4 = [
        { id: 'id7', dictID: 'http://data.bioontology.org/ontologies/E' },
        { id: 'id8', dictID: 'http://data.bioontology.org/ontologies/F' },
        { id: 'id6', dictID: 'http://data.bioontology.org/ontologies/G' }
      ];

      urlToResultsMap.set(url1, res1);
      urlToResultsMap.set(url2, res2);
      urlToResultsMap.set(url3, res3);
      urlToResultsMap.set(url4, res4);

      const expectedUrlToResultsMap = new Map();

      const prunedRes3 = [
        { id: 'id4', dictID: 'http://data.bioontology.org/ontologies/D' }
      ];
      const prunedRes4 = [
        { id: 'id8', dictID: 'http://data.bioontology.org/ontologies/F' }
      ];

      // First two results unchanged
      expectedUrlToResultsMap.set(url1, res1);
      expectedUrlToResultsMap.set(url2, res2);
      // Last two results pruned
      expectedUrlToResultsMap.set(url3, prunedRes3);
      expectedUrlToResultsMap.set(url4, prunedRes4);

      const actualUrlToResultsMap = dict.pruneCommonResultsById(urlToResultsMap);
      actualUrlToResultsMap.should.deep.equal(expectedUrlToResultsMap);
      cb();
    });
  });

  describe('getIDsFromMatchObjArray', () => {
    it('returns all the unique ids from an array of vsm-match objects', cb => {
      let arr = [{ id: 'id1', str: 'str1' },
        { id: 'id2', str: 'str2' },
        { id: 'id3', str: 'str3' }];

      const res1 = dict.getIDsFromMatchObjArray(arr);

      arr.push({id: 'id1', str: 'str1'});
      arr.push({id: 'id3', str: 'str3'});
      arr.push({id: 'id4', str: 'str4'});

      const res2 = dict.getIDsFromMatchObjArray(arr);

      const expectedResult1 = ['id1','id2','id3'];
      // keeps only the unique ids
      const expectedResult2 = ['id1','id2','id3','id4'];

      res1.should.deep.equal(expectedResult1);
      res2.should.deep.equal(expectedResult2);

      cb();
    });

    it('returns an empty array when input is either an empty array ' +
      'or an array whose elements don\'t have the `id` property', cb => {
      const arr1 = [];
      const arr2 = [{ dictID: 'id1', str: 'str1' }, { dictID: 'id2', str: 'str2'}];

      const res1 = dict.getIDsFromMatchObjArray(arr1);
      const res2 = dict.getIDsFromMatchObjArray(arr2);

      res1.should.deep.equal([]);
      res2.should.deep.equal([]);
      cb();
    });

    it('returns proper result when the input array has \'mixed\' elements ' +
      '- some that have the `id` property and some that don\'t', cb => {
      const arr = [{ id: 'id1', str: 'str1' }, { dictID: 'id2', str: 'str2' },
        { id: 'id3', str: 'str3' }];

      const res = dict.getIDsFromMatchObjArray(arr);
      const expectedResult = ['id1', 'id3'];

      res.should.deep.equal(expectedResult);
      cb();
    });
  });

  describe('queryForExactId', () => {
    it('returns true or false if the input URL is querying for a specific id ' +
      'or not', cb => {
      const url1 = testURLBase + '/search?ontologies=&ontology_types=ONTOLOGY&pagesize=1&display_context=false';
      const url2 = testURLBase + '/search?ontologies=NCIT,GO&ontology_types=ONTOLOGY&pagesize=1&display_context=false';
      const url3 = testURLBase + '/search?q=http://purl.obolibrary.org/obo/DOID_1909&ontologies=&require_exact_match=true&display_context=false';
      const url4 = testURLBase + '/search?q=http://purl.obolibrary.org/obo/DOID_1909&ontologies=BAO,DOID&require_exact_match=true&display_context=false';
      const url5 = testURLBase + '/ontologies/GO';

      expect(dict.queryForExactId(url1)).to.equal(false);
      expect(dict.queryForExactId(url2)).to.equal(false);
      expect(dict.queryForExactId(url3)).to.equal(true);
      expect(dict.queryForExactId(url4)).to.equal(true);
      expect(dict.queryForExactId(url5)).to.equal(false);

      cb();
    });
  });

  describe('sortEntries', () => {
    it('sorts VSM entry objects as specified in the documentation', cb => {
      const arr = [
        { id: 'e', dictID: 'b', terms: [{ str: 'a'}] },
        { id: 'd', dictID: 'a', terms: [{ str: 'b'}] },
        { id: 'c', dictID: 'c', terms: [{ str: 'c'}] },
        { id: 'b', dictID: 'a', terms: [{ str: 'b'}] },
        { id: 'a', dictID: 'b', terms: [{ str: 'c'}] }
      ];
      const arrDictIdSorted = [
        { id: 'b', dictID: 'a', terms: [{ str: 'b'}] },
        { id: 'd', dictID: 'a', terms: [{ str: 'b'}] },
        { id: 'a', dictID: 'b', terms: [{ str: 'c'}] },
        { id: 'e', dictID: 'b', terms: [{ str: 'a'}] },
        { id: 'c', dictID: 'c', terms: [{ str: 'c'}] }
      ];
      const arrIdSorted = [
        { id: 'a', dictID: 'b', terms: [{ str: 'c'}] },
        { id: 'b', dictID: 'a', terms: [{ str: 'b'}] },
        { id: 'c', dictID: 'c', terms: [{ str: 'c'}] },
        { id: 'd', dictID: 'a', terms: [{ str: 'b'}] },
        { id: 'e', dictID: 'b', terms: [{ str: 'a'}] }
      ];
      const arrStrSorted = [
        { id: 'e', dictID: 'b', terms: [{ str: 'a'}] },
        { id: 'b', dictID: 'a', terms: [{ str: 'b'}] },
        { id: 'd', dictID: 'a', terms: [{ str: 'b'}] },
        { id: 'a', dictID: 'b', terms: [{ str: 'c'}] },
        { id: 'c', dictID: 'c', terms: [{ str: 'c'}] }
      ];

      const options = {};
      dict.sortEntries(arr, options).should.deep.equal(arrDictIdSorted);
      options.sort = {};
      dict.sortEntries(arr, options).should.deep.equal(arrDictIdSorted);
      options.sort = '';
      dict.sortEntries(arr, options).should.deep.equal(arrDictIdSorted);
      options.sort = 'dictID';
      dict.sortEntries(arr, options).should.deep.equal(arrDictIdSorted);
      options.sort = 'id';
      dict.sortEntries(arr, options).should.deep.equal(arrIdSorted);
      options.sort = 'str';
      dict.sortEntries(arr, options).should.deep.equal(arrStrSorted);

      cb();
    });
  });

  describe('sortMatches', () => {
    it('sorts VSM match objects as specified in the documentation', cb => {
      const arr = dict.sortMatches(testMatchObjArray);
      arr.should.deep.equal(testMatchObjArraySorted);
      cb();
    });
  });

  describe('hijackPageSize', () => {
    it('returns proper pagesize when the `filter.dictID` is not ' +
      ' properly defined', cb => {
      let options = {
        filter: {
          id: ['id1', 'id2', 'id3', 'id4'],
          dictID: []
        },
        perPage: 30
      };

      expect(dict.hijackPageSize(options)).to.equal(130);

      cb();
    });

    it('returns proper pagesize when there is properly defined ' +
      '`filter.dictID`', cb => {
      let options = {
        filter: {
          id: [
            'http://purl.obolibrary.org/obo/BFO_0000002',
            'http://purl.bioontology.org/ontology/LNC/LA14279-6'
          ],
          dictID: [
            'http://data.bioontology.org/ontologies/OGMS',
            'http://data.bioontology.org/ontologies/LOINC'
          ]
        },
        perPage: 30
      };

      expect(dict.hijackPageSize(options)).to.equal(2);

      options.filter.id = ['id1', 'id2', 'id3', 'id4', 'id5', 'id6', 'id7'];
      options.filter.dictID = ['dictID1', 'dictID2', 'dictID3', 'dictID4'];

      expect(dict.hijackPageSize(options)).to.equal(4);

      cb();
    });
  });

  describe('hasProperEntrySortProperty', () => {
    it('returns true or false whether the `options.sort` property for an ' +
      'entry VSM object is properly defined', cb => {
      const options = {};
      expect(dict.hasProperEntrySortProperty(options)).to.equal(false);
      options.sort = [];
      expect(dict.hasProperEntrySortProperty(options)).to.equal(false);
      options.sort = {};
      expect(dict.hasProperEntrySortProperty(options)).to.equal(false);
      options.sort = '';
      expect(dict.hasProperEntrySortProperty(options)).to.equal(false);
      options.sort = 45;
      expect(dict.hasProperEntrySortProperty(options)).to.equal(false);
      options.sort = 'dictID';
      expect(dict.hasProperEntrySortProperty(options)).to.equal(true);
      options.sort = 'id';
      expect(dict.hasProperEntrySortProperty(options)).to.equal(true);
      options.sort = 'str';
      expect(dict.hasProperEntrySortProperty(options)).to.equal(true);
      options.sort = noResultsStr;
      expect(dict.hasProperEntrySortProperty(options)).to.equal(false);

      cb();
    });
  });

  describe('trimDictInfoArray', () => {
    it('correctly trims the array of dictInfo objects based on the values ' +
      'of page, pagesize and the number of results obtained', cb => {
      const arr = [
        {
          id: 'http://data.bioontology.org/ontologies/CHEAR',
          abbrev: 'CHEAR',
          name: 'Children\'s Health Exposure Analysis Resource'
        },
        {
          id: 'http://data.bioontology.org/ontologies/RH-MESH',
          abbrev: 'RH-MESH',
          name: 'Robert Hoehndorf Version of MeSH'
        },
        {
          id: 'http://data.bioontology.org/ontologies/MCCL',
          abbrev: 'MCCL',
          name: 'Cell Line Ontology [by Mahadevan]'
        },
        {
          id: 'http://data.bioontology.org/ontologies/GO',
          abbrev: 'GO',
          name: 'Gene Ontology'
        }
      ];

      const res1 = dict.trimDictInfoArray(arr, 1, 1);
      const res2 = dict.trimDictInfoArray(arr, 2, 1);
      const res3 = dict.trimDictInfoArray(arr, 3, 1);
      const res4 = dict.trimDictInfoArray(arr, 4, 1);
      const res5 = dict.trimDictInfoArray(arr, 5, 1);
      const res6 = dict.trimDictInfoArray(arr, 1, 2);
      const res7 = dict.trimDictInfoArray(arr, 2, 2);
      const res8 = dict.trimDictInfoArray(arr, 3, 2);
      const res9 = dict.trimDictInfoArray(arr, 1, 3);
      const res10 = dict.trimDictInfoArray(arr, 2, 3);
      const res11 = dict.trimDictInfoArray(arr, 3, 3);
      const res12 = dict.trimDictInfoArray(arr, 1, 4);
      const res13 = dict.trimDictInfoArray(arr, 2, 4);

      res1.should.deep.equal([arr[0]]);
      res2.should.deep.equal([arr[1]]);
      res3.should.deep.equal([arr[2]]);
      res4.should.deep.equal([arr[3]]);
      res5.should.deep.equal([]);
      res6.should.deep.equal(arr.slice(0,2));
      res7.should.deep.equal(arr.slice(2,4));
      res8.should.deep.equal([]);
      res9.should.deep.equal(arr.slice(0,3));
      res10.should.deep.equal(arr.slice(3,4));
      res11.should.deep.equal([]);
      res12.should.deep.equal(arr);
      res13.should.deep.equal([]);

      cb();
    });
  });

  describe('fixedEncodeURIComponent', () => {
    it('testing the difference between the standard encoding function ' +
      'and the implementation which is compatible with the RFC 3986', cb => {
      expect(encodeURIComponent('!')).to.equal('!');
      expect(dict.fixedEncodeURIComponent('!')).to.equal('%21');

      expect(encodeURIComponent('\'')).to.equal('\'');
      expect(dict.fixedEncodeURIComponent('\'')).to.equal('%27');

      expect(encodeURIComponent('(')).to.equal('(');
      expect(dict.fixedEncodeURIComponent('(')).to.equal('%28');

      expect(encodeURIComponent(')')).to.equal(')');
      expect(dict.fixedEncodeURIComponent(')')).to.equal('%29');

      expect(encodeURIComponent('*')).to.equal('*');
      expect(dict.fixedEncodeURIComponent('*')).to.equal('%2A');

      cb();
    });
  });

  describe('reArrangeEntries', () => {
    it('returns an empty array when input is an empty array', cb => {
      const res = dict.reArrangeEntries([]);
      expect(res).to.be.empty;
      cb();
    });

    it('returns the same array when no re-arrangement was done', cb => {
      const arr = [ { id: 'id1', z: { dictAbbrev: 'LNC' }},
        { id: 'id2', z: { dictAbbrev: 'CLO' }},
        { id: 'id3', z: { dictAbbrev: 'MO' }},
        { id: 'id4', z: { dictAbbrev: 'RADLEX' }}];

      const arrCloned = JSON.parse(JSON.stringify(arr));

      dict.reArrangeEntries(arr).should.deep.equal(arrCloned);
      cb();
    });

    it('returns a properly re-arranged array when there are entries ' +
      'with the same ids and for which we may or may not be able to ' +
      'correctly infer the source ontology', cb => {
      const arr1 = [
        { id: 'http://purl.bioontology.org/ontology/LNC/LA14279-6',
          z: { dictAbbrev: 'CLO' }},
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'MO' }},
        { id: 'http://purl.bioontology.org/ontology/LNC/LA14279-6',
          z: { dictAbbrev: 'LNC' }},
        { id: 'http://mged.sourceforge.net/ontologies/MGEDOntology.owl#BioMaterial',
          z: { dictAbbrev: 'RADLEX' }}
      ];

      const arr2 = [
        { id: 'http://www.radlex.org/RID/#RID34617',
          z: { dictAbbrev: 'GO' }},
        { id: 'http://mged.sourceforge.net/ontologies/MGEDOntology.owl#BioMaterial',
          z: { dictAbbrev: 'MG' }},
        { id: 'http://purl.bioontology.org/ontology/LNC/LA14279-6',
          z: { dictAbbrev: 'CLO' }},
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'MEDDRA' }},
        { id: 'http://purl.bioontology.org/ontology/LNC/LA14279-6',
          z: { dictAbbrev: 'LNC' }},
        { id: 'http://mged.sourceforge.net/ontologies/MGEDOntology.owl#BioMaterial',
          z: { dictAbbrev: 'RADLEX' }},
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'MEDLINEPLUS' }},
        { id: 'http://www.radlex.org/RID/#RID34617',
          z: { dictAbbrev: 'RADLEX' }}
      ];

      const arr3 = [
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'A' }},
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'B' }},
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'MEDLINEPLUS' }},
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'C' }},
        { id: 'http://www.radlex.org/RID/#RID34617',
          z: { dictAbbrev: 'RADLEX' }}
      ];

      const arr4 = [
        { id: 'http://www.radlex.org/RID/#RID34617',
          z: { dictAbbrev: 'RADLEX' }},
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'A' }},
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'B' }},
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'MEDLINEPLUS' }},
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'C' }}
      ];

      const arr5 = [
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'A' }},
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'B'}},
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'MEDLINEPLUS' }},
        { id: 'http://www.radlex.org/RID/#RID34617',
          z: { dictAbbrev: 'RADLEX' }},
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'C' }}
      ];

      const res1 = dict.reArrangeEntries(arr1);
      const res2 = dict.reArrangeEntries(arr2);
      const res3 = dict.reArrangeEntries(arr3);
      const res4 = dict.reArrangeEntries(arr4);
      const res5 = dict.reArrangeEntries(arr5);

      const expectedResult1 = [
        { id: 'http://purl.bioontology.org/ontology/LNC/LA14279-6',
          z: { dictAbbrev: 'LNC' }},
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'MO' }},
        { id: 'http://mged.sourceforge.net/ontologies/MGEDOntology.owl#BioMaterial',
          z: { dictAbbrev: 'RADLEX' }},
        { id: 'http://purl.bioontology.org/ontology/LNC/LA14279-6',
          z: { dictAbbrev: 'CLO' }}
      ];

      const expectedResult2 = [
        { id: 'http://www.radlex.org/RID/#RID34617',
          z: { dictAbbrev: 'GO' }},
        { id: 'http://mged.sourceforge.net/ontologies/MGEDOntology.owl#BioMaterial',
          z: { dictAbbrev: 'MG' }},
        { id: 'http://purl.bioontology.org/ontology/LNC/LA14279-6',
          z: { dictAbbrev: 'LNC' }},
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'MEDLINEPLUS' }},
        { id: 'http://purl.bioontology.org/ontology/LNC/LA14279-6',
          z: { dictAbbrev: 'CLO' }},
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'MEDDRA' }},
        { id: 'http://mged.sourceforge.net/ontologies/MGEDOntology.owl#BioMaterial',
          z: { dictAbbrev: 'RADLEX' }},
        { id: 'http://www.radlex.org/RID/#RID34617',
          z: { dictAbbrev: 'RADLEX' }}
      ];

      const expectedResult3 = [
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'MEDLINEPLUS' }},
        { id: 'http://www.radlex.org/RID/#RID34617',
          z: { dictAbbrev: 'RADLEX' }},
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'A' }},
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'B' }},
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'C' }}
      ];

      const expectedResult4 = [
        { id: 'http://www.radlex.org/RID/#RID34617',
          z: { dictAbbrev: 'RADLEX' }},
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'MEDLINEPLUS' }},
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'A' }},
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'B' }},
        { id: 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202',
          z: { dictAbbrev: 'C' }}
      ];

      const expectedResult5 = expectedResult3;

      res1.should.deep.equal(expectedResult1);
      res2.should.deep.equal(expectedResult2);
      res3.should.deep.equal(expectedResult3);
      res4.should.deep.equal(expectedResult4);
      res5.should.deep.equal(expectedResult5);

      cb();
    });
  });

  describe('inferDictAbbrevFromId', () => {
    it('correctly infers the dictAbbrev from the given (URI) id', cb => {
      const id1 = 'http://purl.bioontology.org/ontology/MEDLINEPLUS/C0025202';
      const id2 = 'http://purl.bioontology.org/ontology/MEDDRA/10053571';
      const id3 = 'http://purl.bioontology.org/ontology/LNC/LA14279-6';
      const id4 = 'http://purl.bioontology.org/ontology/MESH/C433048';
      const id5 = 'http://purl.obolibrary.org/obo/BFO_0000002';
      const id6 = 'http://purl.obolibrary.org/obo/GO_0120069';
      const id7 = 'http://purl.obolibrary.org/obo/MP_0020484';
      const id8 = 'http://www.ebi.ac.uk/efo/EFO_0008200';
      const id9 = 'http://www.orpha.net/ORDO/Orphanet_276405';

      expect(dict.inferDictAbbrevFromId(id1)).to.equal('MEDLINEPLUS');
      expect(dict.inferDictAbbrevFromId(id2)).to.equal('MEDDRA');
      expect(dict.inferDictAbbrevFromId(id3)).to.equal('LNC');
      expect(dict.inferDictAbbrevFromId(id4)).to.equal('MESH');
      expect(dict.inferDictAbbrevFromId(id5)).to.equal('BFO');
      expect(dict.inferDictAbbrevFromId(id6)).to.equal('GO');
      expect(dict.inferDictAbbrevFromId(id7)).to.equal('MP');
      expect(dict.inferDictAbbrevFromId(id8)).to.equal('EFO');
      expect(dict.inferDictAbbrevFromId(id9)).to.equal('ORDO');

      cb();
    });

    it('returns an empty dictAbbrev if it cannot find a proper one for ' +
      'the (URI) id given', cb => {
      const id1 = 'http://www.semanticweb.org/pallabi.d/ontologies/2014/2/untitled-ontology-11#Melanoma';
      const id2 = 'http://www.semanticweb.org/projectlab/ontologies/2016/8/untitled-ontology-23#Garud_Commando_Force';
      const id3 = 'http://mged.sourceforge.net/ontologies/MGEDOntology.owl#BioMaterial';
      const id4 = 'http://www.radlex.org/RID/#RID34617';
      const id5 = 'http://purl.jp/bio/4/id/200906027145492426';

      expect(dict.inferDictAbbrevFromId(id1)).to.equal('');
      expect(dict.inferDictAbbrevFromId(id2)).to.equal('');
      expect(dict.inferDictAbbrevFromId(id3)).to.equal('');
      expect(dict.inferDictAbbrevFromId(id4)).to.equal('');
      expect(dict.inferDictAbbrevFromId(id5)).to.equal('');

      cb();
    });
  });
});
