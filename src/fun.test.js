const { getLastPartOfURL, fixedEncodeURIComponent, isJSONString, deepClone,
  hasProperEntrySortProperty, removeDuplicates } = require('./fun');
const chai = require('chai'); chai.should();
const expect = chai.expect;
const fs = require('fs');
const path = require('path');

const jsonMelanoma1resultPath = path.join(__dirname, '..',
  'resources', 'query_melanoma_1_result.json');
const jsonNoResultsPath = path.join(__dirname, '..',
  'resources', 'query_no_results.json');
const jsonNonValidAPIKeyPath = path.join(__dirname, '..',
  'resources', 'not_valid_api_key_error.json');

const melanoma1resultJSONString =
  fs.readFileSync(jsonMelanoma1resultPath, 'utf8');
const melanomaNoResultsJSONString =
  fs.readFileSync(jsonNoResultsPath, 'utf8');
const nonValidAPIKeyJSONString =
  fs.readFileSync(jsonNonValidAPIKeyPath, 'utf8');

describe('fun.js', () => {

  describe('getLastPartOfURL', () => {
    it('returns the last part of a URL', cb => {
      const url1 = 'http://data.bioontology.org/ontologies/RH-MESH';
      const url2 = 'https://www.uniprot.org/uniprot/P12345';
      const url3 = 'a/b/e';
      const url4 = 'string';

      getLastPartOfURL(url1).should.equal('RH-MESH');
      getLastPartOfURL(url2).should.equal('P12345');
      getLastPartOfURL(url3).should.equal('e');
      getLastPartOfURL(url4).should.equal('string');

      cb();
    });
  });

  describe('fixedEncodeURIComponent', () => {
    it('tests the difference between the standard encoding function ' +
      'and the updated implementation (compatible with RFC 3986)', cb => {
      encodeURIComponent('!').should.equal('!');
      fixedEncodeURIComponent('!').should.equal('%21');

      encodeURIComponent('\'').should.equal('\'');
      fixedEncodeURIComponent('\'').should.equal('%27');

      encodeURIComponent('(').should.equal('(');
      fixedEncodeURIComponent('(').should.equal('%28');

      encodeURIComponent(')').should.equal(')');
      fixedEncodeURIComponent(')').should.equal('%29');

      encodeURIComponent('*').should.equal('*');
      fixedEncodeURIComponent('*').should.equal('%2A');

      cb();
    });
  });

  describe('isJSONString', () => {
    it('returns true or false whether the provided string is a JSON string or ' +
      'not!', cb => {
      expect(isJSONString(melanoma1resultJSONString)).to.equal(true);
      expect(isJSONString(melanomaNoResultsJSONString)).to.equal(true);
      expect(isJSONString(nonValidAPIKeyJSONString)).to.equal(true);

      expect(isJSONString('')).to.equal(false);
      expect(isJSONString('melanoma')).to.equal(false);
      expect(isJSONString('<h1>Not Found</h1>')).to.equal(false);
      expect(isJSONString('[\'<h1> not found </h1>\']')).to.equal(false);
      expect(isJSONString([])).to.equal(false);
      expect(isJSONString({})).to.equal(false);
      expect(isJSONString('{}')).to.equal(true);

      cb();
    });
  });

  describe('hasProperEntrySortProperty', () => {
    it('returns true or false whether the `options.sort` property for an ' +
      'entry VSM object is properly defined', cb => {
      const options = {};
      expect(hasProperEntrySortProperty(options)).to.equal(false);
      options.sort = [];
      expect(hasProperEntrySortProperty(options)).to.equal(false);
      options.sort = {};
      expect(hasProperEntrySortProperty(options)).to.equal(false);
      options.sort = '';
      expect(hasProperEntrySortProperty(options)).to.equal(false);
      options.sort = 45;
      expect(hasProperEntrySortProperty(options)).to.equal(false);
      options.sort = 'dictID';
      expect(hasProperEntrySortProperty(options)).to.equal(true);
      options.sort = 'id';
      expect(hasProperEntrySortProperty(options)).to.equal(true);
      options.sort = 'str';
      expect(hasProperEntrySortProperty(options)).to.equal(true);
      options.sort = 'xaxaxaxa!!!';
      expect(hasProperEntrySortProperty(options)).to.equal(false);

      cb();
    });
  });

  describe('deepClone', () => {
    it('deep-clones, so changes on the original object do not affect '
      + 'the clone', () => {
      let x = { a: 1,  b: {c: 1} };
      let y = deepClone(x);
      y.b.c = 2;

      x.should.deep.equal({ a: 1,  b: {c: 1} });
      y.should.deep.equal({ a: 1,  b: {c: 2} });
    });
  });

  describe('removeDuplicates', () => {
    it('returns proper results', cb => {
      removeDuplicates([]).should.deep.equal([]);
      removeDuplicates([1,2,3]).should.deep.equal([1,2,3]);
      removeDuplicates([1,2,1,3,1,2]).should.deep.equal([1,2,3]);
      removeDuplicates(['r','t','t','s','r','e','s'])
        .should.deep.equal(['r','t','s','e']);
      cb();
    });
  });
});