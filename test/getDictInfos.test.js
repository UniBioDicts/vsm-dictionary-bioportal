/**
 * File used to quick test the `getDictInfos` function of
 * `DictionaryBioPortal.js`
 */

const DictionaryBioPortal = require('../src/DictionaryBioPortal');

// the following API key is for user `vsmtest`
const apiKey = '5904481f-f6cb-4c71-94d8-3b775cf0f19e';
const dict = new DictionaryBioPortal({apiKey: apiKey, log: true});

dict.getDictInfos(
  { filter: { id: [
    'http://data.bioontology.org/ontologies/CHEAR',
    'http://data.bioontology.org/ontologies/RH-MESH',
    'http://data.bioontology.org/ontologies/MCCL',
    'http://data.bioontology.org/ontologies/GO',
    'nonValidOntologyAcronymIsNotAnErrorAnymore'
  ]},
  page: 2,
  perPage: 3
  }, (err, res) => {
    if (err) console.log(JSON.stringify(err, null, 4));
    else {
      console.log(JSON.stringify(res, null, 4));
      console.log('\n#Results: ' + res.items.length);
    }
  }
);
