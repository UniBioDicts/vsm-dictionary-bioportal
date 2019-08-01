/**
 * File used to quick test the `getEntries` function of
 * `DictionaryBioPortal.js`
 */

const DictionaryBioPortal = require('../src/DictionaryBioPortal');

// the following API key is for user `vsmtest`
const apiKey = '5904481f-f6cb-4c71-94d8-3b775cf0f19e';
const dict = new DictionaryBioPortal({apiKey: apiKey, log: true});

dict.getEntries(
  { filter: {
    id: [
      'http://www.semanticweb.org/pallabi.d/ontologies/2014/2/untitled-ontology-11#CXorf36-Glu142*',
      'http://purl.obolibrary.org/obo/BFO_0000040',
      'http://purl.bioontology.org/ontology/MEDDRA/10053571',
      'http://purl.obolibrary.org/obo/BFO_0000002',
      'http://semantic-dicom.org/dcm#ATT2010015E' // from property_search
    ],
    dictID : []
  },
  page: 1,
  perPage: 5,
  getAllResults: false
  }, (err, res) => {
    if (err) console.log(JSON.stringify(err, null, 4));
    else {
      console.log(JSON.stringify(res, null, 4));
      console.log('\n#Results: ' + res.items.length);
    }
  }
);
