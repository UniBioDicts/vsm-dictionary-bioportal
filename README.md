# vsm-dictionary-bioportal

## Summary

`vsm-dictionary-bioportal` is an implementation 
of the 'VsmDictionary' parent-class/interface (from the package
[`vsm-dictionary`](https://github.com/vsmjs/vsm-dictionary)), that
communicates with [BioPortal's](https://bioportal.bioontology.org/) 
REST API and translates the provided terms+IDs into a VSM-specific format.

## Example use

You first need to have a BioPortal account to use this dictionary. Once you 
have an account, you will be given an API key to authorise your access to 
the provided REST API's resources. Then, you can create a `test.js` file and
include this code:

```javascript
var DictionaryBioPortal = require('./DictionaryBioPortal');
var apiKey = 'a-valid-API-key-string';
var dict = new DictionaryBioPortal({apiKey: apiKey});
dict.getMatchesForString('melanoma', 
{ filter: { dictID : ['RH-MESH', 'MCCL', 'CHEAR'] }, 
  sort: { dictID : ['CHEAR'] },
  z: true,
  page: 1,
  perPage: 20 
}, (err, res) => console.log(JSON.stringify(res, null, 4)));
```
Then, run `node test.js`

## Tests

Run `npm test`, which runs tests with Mocha.  
Run `npm run testw`, which automatically reruns tests on any
file change.

## Browser Demo 

Run `npm run demo` to start the interactive demo.
The demo currently supports only the `getMatchesForString()` function.
This command automatically opens a browser page with 4 input-fields to
search on BioPortal ontology data. The 4 inputs fields represent:
+ The string to search results for
+ The dictionary IDs (ontology IDs), comma separated, that will be used 
as arguments for filtering the results
+ The preferred dictionary IDs (ontology IDs), comma separated, that 
will be used as arguments for sorting the results
+ The z-object's properties to be kept in the result (if left empty, 
all properties will be shown).

The demo works by making a Webpack dev-server bundle all source code 
and serve it to the browser.

## Specification

Like all VsmDictionary subclass implementations, this package follows
the parent class
[specification](https://github.com/vsmjs/vsm-dictionary/blob/master/Dictionary.spec.md).
Next, we will explain the mapping between BioPortal's API 
results (as specified in the [API documentation](http://data.bioontology.org/documentation))
and the corresponding VSM objects.

- `getEntryMatchesForString(str, options, cb)`

An example of the URL string that is prepared and send to BioPortal is:

`http://data.bioontology.org/search?q=melanoma&ontologies=RH-MESH,MCCL,CHEAR&page=1&pagesize=40&display_context=false`

The `ontologies` map to the `options.filter.dictID`, `page` to `options.page`
and `pagesize` to `options.perPage`. All these are optional URL parameters. 
The search string is obligatory though (if you want to get non-empty results :) 
and the `display_context=false` is always added since it does not provide any
useful data to be mapped to VSM objects.

After hitting such a query, the result JSON object includes a `collection` 
property which has as a value, an array of objects. Each object/element of 
that array is an entry which is mapped to a VSM match-object. The mapping is
fully detailed in the table below:

BioPortal entry's property | Type | Required | VSM match-object property | Notes  
:---:|:---:|:---:|:---:|---
`@id` | URL | **YES** | `id` | the concept-ID
`links.ontology` | URL | **YES** | `dictID` | the unique name of the ontology (part of the URL) 
`prefLabel` | String | **YES** | `str` | the string representation of the term
`definition` | Array | NO | `descr` | we map the first definition only
`synonym` | Array | NO | `terms.str` | we map the whole array
`links.ontology` | URL | **YES** | `z.dictURL` | the (unique) ontology URL
`cui` | Array | NO | `z.cui` | Concept Unique Identifier
`semanticType` | Array | NO | `z.tui` | Type Unique Identifier

## Documentation

To see this *README.md* in a nice-looking web-page, run: <br/>
`gitbook serve` and browse to `http://localhost:4000`.
