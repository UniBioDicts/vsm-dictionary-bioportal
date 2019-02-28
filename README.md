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
  { filter: { dictID : [
      'http://data.bioontology.org/ontologies/RH-MESH',
      'http://data.bioontology.org/ontologies/MCCL',
      'http://data.bioontology.org/ontologies/CHEAR' 
    ]},
    sort: { dictID : ['http://data.bioontology.org/ontologies/CHEAR'] },
    z: true,
    page: 1,
    perPage: 50 
  }, (err, res) => console.log(JSON.stringify(res, null, 4)));
```
Then, run `node test.js`

## Tests

Run `npm test`, which runs tests with Mocha.

## Browser Demo 

Run `npm run demo` to start the interactive demo.
The demo currently supports only the `getMatchesForString()` function.
This command automatically opens a browser page with 6 input-fields to
search on BioPortal ontology data. The 6 inputs fields represent:
1. The string to search results for
2. The dictionary abbreviations (e.g. GO,MCCL), comma separated, that 
will be used as arguments for filtering the results
3. The preferred dictionary abbreviations, comma separated, that 
will be used as arguments for sorting the results
4. The z-object's properties to be kept in the result (if left empty, 
all properties will be shown)
5. The page number - note that only for `page=1` there is a possibility
of sorting the results taking into account the preferred dictionaries
6. The page size returned, which is the maximum number of returned 
terms/results in the demo.

The demo works by making a Webpack dev-server bundle all source code 
and serve it to the browser.

## 'Build' configuration & demo

To use a VsmDictionary in Node.js, one can simply run `npm install` and then
use `require()`. But it is also convenient to have a version of the code that
can just be loaded via a &lt;script&gt;-tag in the browser.

Therefore, we included `webpack.config.js` (note: the one in the root folder, 
_not_ the one in the 'demo' folder), which is a Webpack configuration file for 
generating such a browser-ready package.

By running `npm build`, the built file will appear in a 'dist' subfolder. 
A demo-use of this file can then be seen by opening `demo-build.html` 
(in the 'demo' folder). (It includes a 
`<script src="../dist/vsm-dictionary-bioportal.min.js"></script>` tag). 
So after the build step, `demo-build.html` does not need Webpack to run.

## Specification

Like all VsmDictionary subclass implementations, this package follows
the parent class
[specification](https://github.com/vsmjs/vsm-dictionary/blob/master/Dictionary.spec.md).
Next, we will explain the mapping between BioPortal's API 
results (as specified in the [API documentation](http://data.bioontology.org/documentation))
and the corresponding VSM objects.

### Map BioPortal to DictInfo VSM object

This specification relates to the function:  
 `getDictInfos(options, cb)`

An example of a URL string that is being built and send to BioPortal is:
```
http://data.bioontology.org/ontologies/GO?display_context=false
```
If `options.filter.id` is empty or not properly defined, then we query all 
BioPortal's ontologies with:
```
http://data.bioontology.org/ontologies/?display_context=false
```

The `options.page` and `options.perPage` are used after the results are 
returned to filter/prune their number (if they are present). If these options
are missing you get all results unpruned.

After sending a query to ask for information about a specific ontology, the 
returned JSON result is mapped to a VSM dictInfo object. The mapping is fully 
detailed in the table below:

BioPortal ontology property | Type | Required | VSM dictInfo object property | Notes  
:---:|:---:|:---:|:---:|---
`@id` | URL | **YES** | `id` | the unique ontology URI
`acronym` | String | **YES** | `abbrev` | the unique ontology acronym
`name` | String | **YES** | `name` | the full name of the ontology

### Map BioPortal to Entry VSM object

### Map BioPortal to Match VSM object

This specification relates to the function:  
 `getEntryMatchesForString(str, options, cb)`

An example of a URL string that is being built and send to BioPortal is:
```
http://data.bioontology.org/search?q=melanoma&ontologies=RH-MESH,MCCL&page=1&pagesize=40&display_context=false
```

The parameters are as follows:
- `str` maps to `q=str`
- `page` is the `options.page` and `pagesize` is `options.perPage`
- The `ontologies` part of the URL corresponds to the sub-dictionaries from 
where we want to get terms. This parameter is being built according to the 
values of `options.filter.dictID` and `options.sort.dictID` as well as the
[specification](https://github.com/vsmjs/vsm-dictionary/blob/master/Dictionary.spec.md)
 of the vsm-dictionary parent class. Note that there can be cases where 2 URLs
 are fired (simultaneously) during a string search to get results for preferred
 dictionaries and all the rest for example.
 
All the above are optional URL parameters, meaning that if
for example the `options` object is empty, then the default BioPortal API 
values will be used instead for `page` and `pagesize` (1 and 50 respectively), 
while the search will be done on all ontologies available at BioPortal's 
repository (the `ontologies=` part of the URL will be pruned):  
```
http://data.bioontology.org/search?q=melanoma&display_context=false
```

The search string is obligatory though (if you want to get non-empty results :) 
and the `display_context=false` is always added since it does not provide any
useful data to be mapped to a VSM match object.

After sending such a query, the returned JSON result object includes a 
`collection` property which has as a value, an array of objects. Each 
object/element of that array is an entry which is mapped to a VSM match 
object. The mapping is fully detailed in the table below:

BioPortal entry's property | Type | Required | VSM match object property | Notes  
:---:|:---:|:---:|:---:|---
`@id` | URL | **YES** | `id` | the concept-ID
`links.ontology` | URL | **YES** | `dictID` | the unique identifier of the ontology 
`prefLabel` | String | **YES** | `str` | the string representation of the term
`definition` | Array | NO | `descr` | we map the first definition only
`synonym` | Array | NO | `terms.str` | we map the whole array
`links.ontology` | URL | **YES** | `z.dictAbbrev` | the unique ontology acronym
`cui` | Array | NO | `z.cui` | Concept Unique Identifier
`semanticType` | Array | NO | `z.tui` | Type Unique Identifier

## Documentation

You can view this *README* in gitbook format 
[here](https://vsmjs.github.io/vsm-dictionary-bioportal/).