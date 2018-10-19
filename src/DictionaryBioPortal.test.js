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
  var searchNoResultsStr = 'somethingthatdoesnotexist';
  var numberStr = '5';
  var refStr = 'it';
  var searchMelanomaUrl = '/search?q=' + melanomaStr + noContext;
  var searchMelanomaUrlWithOptions = '/search?q=' + melanomaStr +
    '&ontologies=RADLEX,MCCL,VO' + noContext;
  var searchNumUrl = '/search?q=' + numberStr + noContext;
  var searchRefUrl = '/search?q=' + refStr + noContext;
  var noResultsUrl = '/search?q=' + searchNoResultsStr + noContext;
  var jsonMelanomaPath = path.join(__dirname, '..', 'resources', 'query_melanoma_5_results.json');
  var jsonMelanomaFilteredPath = path.join(__dirname, '..', 'resources', 'query_melanoma_3_results.json');
  var jsonNoResultsPath = path.join(__dirname, '..', 'resources', 'query_no_results.json');
  var jsonMelanomaStringResponse = fs.readFileSync(jsonMelanomaPath, 'utf8');
  var jsonMelanomaFilteredStringResponse = fs.readFileSync(jsonMelanomaFilteredPath, 'utf8');
  var jsonNoResultsResponse = fs.readFileSync(jsonNoResultsPath, 'utf8');

  var matchObjArray =  [
    {
      id:     'http://purl.obolibrary.org/obo/DOID_1909',
      dictID: 'CLO',
      str:    'melanoma',
      descr:  'A cell type cancer that has_material_basis_in abnormally proliferating cells derives_from melanocytes which are found in skin, the bowel and the eye.',
      type:   'S',
      z: {
        dictURL: 'http://data.bioontology.org/ontologies/CLO'
      }
    },
    {
      id:     'http://www.radlex.org/RID/#RID34617',
      dictID: 'RADLEX',
      str:    'melanoma',
      type:   'S',
      z: {
        dictURL: 'http://data.bioontology.org/ontologies/RADLEX'
      }
    },
    {
      id:     'http://purl.obolibrary.org/obo/DOID_1909',
      dictID: 'VO',
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
        dictURL: 'http://data.bioontology.org/ontologies/VO'
      }
    },
    {
      id:     'http://scai.fraunhofer.de/CSEO#Melanoma',
      dictID: 'CSEO',
      str:    'Melanoma',
      type:   'T',
      z: {
        dictURL: 'http://data.bioontology.org/ontologies/CSEO'
      }
    },
    {
      id:     'http://www.semanticweb.org/pallabi.d/ontologies/2014/2/untitled-ontology-11#Melanoma',
      dictID: 'MCCL',
      str:    'Melanoma',
      type:   'T',
      z: {
        dictURL: 'http://data.bioontology.org/ontologies/MCCL'
      }
    }
  ];
  var matchObjArraySorted = [
    {
      id: 'http://www.semanticweb.org/pallabi.d/ontologies/2014/2/untitled-ontology-11#Melanoma',
      dictID: 'MCCL',
      str: 'Melanoma',
      type: 'T',
      z: {
        dictURL: 'http://data.bioontology.org/ontologies/MCCL'
      }
    },
    {
      id: 'http://www.radlex.org/RID/#RID34617',
      dictID: 'RADLEX',
      str: 'melanoma',
      type: 'S',
      z: {
        dictURL: 'http://data.bioontology.org/ontologies/RADLEX',
        cui: [
          'C0025202'
        ],
        tui: [
          'T191'
        ]
      }
    },
    {
      id: 'http://purl.obolibrary.org/obo/DOID_1909',
      dictID: 'VO',
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
      ],
      z: {
        dictURL: 'http://data.bioontology.org/ontologies/VO'
      }
    }
  ];
  var testMatchObjArray = [
    {
      id:     'id1',
      dictID: 'A',
      str:    'melanoma',
      descr:  'A definition',
      type:   'S',
      z: {
        dictURL: 'http://test/ontologies/A'
      }
    },
    {
      id:     'id2',
      dictID: 'A',
      str:    'zelanoma',
      descr:  'A definition',
      type:   'S',
      z: {
        dictURL: 'http://test/ontologies/A'
      }
    },
    {
      id:     'id3',
      dictID: 'A',
      str:    'xelanoma',
      descr:  'A definition',
      type:   'S',
      z: {
        dictURL: 'http://test/ontologies/A'
      }
    },
    {
      id:     'id4',
      dictID: 'A',
      str:    'zelanoma',
      descr:  'A definition',
      type:   'T',
      z: {
        dictURL: 'http://test/ontologies/A'
      }
    },
    {
      id:     'id5',
      dictID: 'c',
      str:    'melanoma',
      descr:  'A definition',
      type:   'T',
      z: {
        dictURL: 'http://test/ontologies/c'
      }
    },
    {
      id:     'id6',
      dictID: 'b',
      str:    'melanoma',
      descr:  'A definition',
      type:   'S',
      z: {
        dictURL: 'http://test/ontologies/b'
      }
    }
  ];
  var testMatchObjArraySortedWithPrefDict = [
    {
      id: 'id5',
      dictID: 'c',
      str: 'melanoma',
      descr: 'A definition',
      type: 'T',
      z: {
        dictURL: 'http://test/ontologies/c'
      }
    },
    {
      id: 'id1',
      dictID: 'A',
      str: 'melanoma',
      descr: 'A definition',
      type: 'S',
      z: {
        dictURL: 'http://test/ontologies/A'
      }
    },
    {
      id: 'id6',
      dictID: 'b',
      str: 'melanoma',
      descr: 'A definition',
      type: 'S',
      z: {
        dictURL: 'http://test/ontologies/b'
      }
    },
    {
      id: 'id3',
      dictID: 'A',
      str: 'xelanoma',
      descr: 'A definition',
      type: 'S',
      z: {
        dictURL: 'http://test/ontologies/A'
      }
    },
    {
      id: 'id2',
      dictID: 'A',
      str: 'zelanoma',
      descr: 'A definition',
      type: 'S',
      z: {
        dictURL: 'http://test/ontologies/A'
      }
    },
    {
      id: 'id4',
      dictID: 'A',
      str: 'zelanoma',
      descr: 'A definition',
      type: 'T',
      z: {
        dictURL: 'http://test/ontologies/A'
      }
    }
  ];
  var testMatchObjArraySortedWithoutPrefDict = [
    {
      id:     'id1',
      dictID: 'A',
      str:    'melanoma',
      descr:  'A definition',
      type:   'S',
      z: {
        dictURL: 'http://test/ontologies/A'
      }
    },
    {
      id:     'id6',
      dictID: 'b',
      str:    'melanoma',
      descr:  'A definition',
      type:   'S',
      z: {
        dictURL: 'http://test/ontologies/b'
      }
    },
    {
      id:     'id3',
      dictID: 'A',
      str:    'xelanoma',
      descr:  'A definition',
      type:   'S',
      z: {
        dictURL: 'http://test/ontologies/A'
      }
    },
    {
      id:     'id2',
      dictID: 'A',
      str:    'zelanoma',
      descr:  'A definition',
      type:   'S',
      z: {
        dictURL: 'http://test/ontologies/A'
      }
    },
    {
      id:     'id5',
      dictID: 'c',
      str:    'melanoma',
      descr:  'A definition',
      type:   'T',
      z: {
        dictURL: 'http://test/ontologies/c'
      }
    },
    {
      id:     'id4',
      dictID: 'A',
      str:    'zelanoma',
      descr:  'A definition',
      type:   'T',
      z: {
        dictURL: 'http://test/ontologies/A'
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
      nock(testURLBase).get(searchMelanomaUrl).
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
      dict.getEntryMatchesForString(searchNoResultsStr, {}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({ items: [] });
        cb();
      });
    });

    it('calls its URL, with a test url+apiKey ' +
        'and returns proper vsm match objects', cb => {
      nock(testURLBase).get(searchMelanomaUrl).
        reply(200, jsonMelanomaStringResponse);
      dict.getEntryMatchesForString(melanomaStr, {}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({ items: matchObjArray });
        cb();
      });
    });

    it('calls its URL, with a test url+apiKey and options ' +
      'for filtering and sorting the results and returns proper ' +
      'vsm match objects', cb => {
      nock(testURLBase).get(searchMelanomaUrlWithOptions).
        reply(200, jsonMelanomaFilteredStringResponse);
      dict.getEntryMatchesForString(melanomaStr,
        {
          filter: {dictID: ['RADLEX', 'MCCL', 'VO']},
          sort: {dictID: ['MCCL']}
        }, (err, res) => {
          expect(err).to.equal(null);
          res.should.deep.equal({items: matchObjArraySorted});
          cb();
        });
    });

    it('calls its URL, with a test url+apiKey and options ' +
      'for filtering, z-pruning and sorting the results and returns proper ' +
      'vsm match objects', cb => {
      nock(testURLBase).get(searchMelanomaUrlWithOptions).
        reply(200, jsonMelanomaFilteredStringResponse);

      // manually build the result array of objects
      // with the specified z-prune options
      var expectedResult = JSON.parse(JSON.stringify(matchObjArraySorted));
      expectedResult.forEach(entry => {
        if (entry.dictID === 'RADLEX') {
          delete entry.z.cui;
          delete entry.z.tui;
        }
      });

      dict.getEntryMatchesForString(melanomaStr,
        {
          filter: {dictID: ['RADLEX', 'MCCL', 'VO']},
          sort: {dictID: ['MCCL']},
          z: ['dictURL']
        }, (err, res) => {
          expect(err).to.equal(null);
          res.should.deep.equal({items: expectedResult});
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

  describe('prepareURLString', () => {

    it('returns proper url when no filter is given', cb => {
      var url = dict.prepareURLString('searchString', {});
      url.should.equal(testURLBase + '/search?q=searchString&display_context=false');
      cb();
    });

    it('returns proper url when a non-proper filter property is given', cb => {
      var url = dict.prepareURLString('searchString',
        { filter :  { wrongProperty : ['o'] }});
      url.should.equal(testURLBase + '/search?q=searchString&display_context=false');
      cb();
    });

    it('returns proper url when the dictID filter property is an empty array', cb => {
      var url = dict.prepareURLString('searchString',
        { filter :  { dictID : [] }});
      url.should.equal(testURLBase + '/search?q=searchString&display_context=false');
      cb();
    });

    it('returns proper url when the dictID filter property is an non-empty array', cb => {
      var url = dict.prepareURLString('searchString',
        { filter :  { dictID : ['A','B','C'] }});
      url.should.equal(testURLBase + '/search?q=searchString&ontologies=A,B,C&display_context=false');
      cb();
    });

    it('returns proper url when the page property is not a number', cb => {
      var url = dict.prepareURLString('searchString', { page : 'String' });
      url.should.equal(testURLBase + '/search?q=searchString&display_context=false');
      cb();
    });

    it('returns proper url when the page property is a non-valid integer', cb => {
      var url = dict.prepareURLString('searchString', { page : 0 });
      url.should.equal(testURLBase + '/search?q=searchString&display_context=false');
      cb();
    });

    it('returns proper url when the page property is a valid integer', cb => {
      var url = dict.prepareURLString('searchString', { page : 2 });
      url.should.equal(testURLBase + '/search?q=searchString&page=2&display_context=false');
      cb();
    });

    it('returns proper url when the perPage property is not a number', cb => {
      var url = dict.prepareURLString('searchString', { perPage : ['Str'] });
      url.should.equal(testURLBase + '/search?q=searchString&display_context=false');
      cb();
    });

    it('returns proper url when the perPage property is a non-valid integer', cb => {
      var url = dict.prepareURLString('searchString', { perPage : 0 });
      url.should.equal(testURLBase + '/search?q=searchString&display_context=false');
      cb();
    });

    it('returns proper url when the perPage property is a valid integer', cb => {
      var url = dict.prepareURLString('searchString', { perPage : 1 });
      url.should.equal(testURLBase + '/search?q=searchString&pagesize=1&display_context=false');
      cb();
    });
  });

  describe('sortWithPreferredDict', () => {
    it('sorts results taking care of the preferred dictionaries first', cb => {
      var arr = dict.sortWithPreferredDict(testMatchObjArray, { sort: { dictID: ['c'] }});
      arr.should.deep.equal(testMatchObjArraySortedWithPrefDict);
      cb();
    });
  });

  describe('sortWithoutPreferredDict', () => {
    it('sorts results normally (as specified in the documentation)', cb => {
      var arr = dict.sortWithoutPreferredDict(testMatchObjArray, {});
      arr.should.deep.equal(testMatchObjArraySortedWithoutPrefDict);
      cb();
    });
  });

});
