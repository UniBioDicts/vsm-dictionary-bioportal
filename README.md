# vsm-dictionary-bioportal

<!-- badges: start -->
[![Travis build status](https://travis-ci.org/vsmjs/vsm-dictionary-bioportal.svg?branch=master)](https://travis-ci.org/vsmjs/vsm-dictionary-bioportal)
[![codecov](https://codecov.io/gh/vsmjs/vsm-dictionary-bioportal/branch/master/graph/badge.svg)](https://codecov.io/gh/vsmjs/vsm-dictionary-bioportal)
[![npm version](https://img.shields.io/npm/v/vsm-dictionary-bioportal)](https://www.npmjs.com/package/vsm-dictionary-bioportal)
[![Downloads](https://img.shields.io/npm/dm/vsm-dictionary-bioportal)](https://www.npmjs.com/package/vsm-dictionary-bioportal)
[![License](https://img.shields.io/npm/l/vsm-dictionary-bioportal)](#license)
<!-- badges: end -->

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
include this code for example:

```javascript
const DictionaryBioPortal = require('./DictionaryBioPortal');
const apiKeyString = 'a-valid-API-key-string';
const dict = new DictionaryBioPortal({apiKey: apiKeyString});

dict.getEntryMatchesForString('melanoma',
  { filter: { dictID : [
        'http://data.bioontology.org/ontologies/RH-MESH',
        'http://data.bioontology.org/ontologies/MCCL',
        'http://data.bioontology.org/ontologies/MEDDRA'
      ]},
    sort: { dictID : ['http://data.bioontology.org/ontologies/RH-MESH'] },
    z: true,
    page: 1,
    perPage: 10
  }, (err, res) => {
    if (err) 
      console.log(JSON.stringify(err, null, 4));
    else
      console.log(JSON.stringify(res, null, 4));
  }
);
```
Then, run `node test.js`

## Tests

Run `npm test`, which runs the source code tests with Mocha.  
If you want to live test the BioPortal API and the main functions provided
by DictionaryBioPortal, go to the `test` directory and run:
```
node getDictInfos.test.js
node getEntries.test.js
node getEntryMatchesForString.test.js
```

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
In the next sections we will explain the mapping between BioPortal's API 
terms (as specified in the [API documentation](http://data.bioontology.org/documentation))
and the corresponding VSM objects. First, some info about the API itself:

Most of the queries we launch against BioPortal use the *search* and 
*property_search* endpoints: `/search?q={search query}` and 
`/property_search?q={search query}`, along with different parameters. One of 
the most important parameters is the filtering on the ontologies' abbreviation
names: `ontologies={ontologyAbbrev1,ontologyAbbrev2,ontologyAbbrev3}`.

The returned terms have fields which are matched against the *search query* 
(q parameter). The fields are searched based on the following order of 
**match rank priority:**
- id
- prefLabelExact (match on the full pref label) 
- prefLabel (match on partial pref label)
- synonymExact (match on the full synonym(s))
- synonym (match on the partial synonym(s))
- notation (last fragment of id)
- cui (for UMLS ontologies)
- semantic_types

If the URL has the `ontologies` parameter, then when you get results that have 
the same field from the list above (e.g. same id), these are ordered according 
to an internal (BioPortal) **ontology ranking**, which is updated every week. 
At the time of writing these lines, the latest ranking was stored 
[here](https://gist.github.com/mdorf/cea96433cf4bf7dd94d109c8e06e29c0) for 
reference.

Note also that we implement **strict error handling** in the sense that whenever 
we launch multiple parallel queries to BioPortal's REST API (see the functions 
specifications below), if one of them returns an error (either a string or an error 
JSON object response), then the result will be an error object (no matter if all the 
rest of the calls returned proper results). 

If the error response in not a JSON string that we can parse, we formulate the 
error as a JSON object ourselves in the following format:
```
{
  status: <number>,
  error: <response> 
}
```
where the *response* from the server is JSON stringified.

### Map BioPortal to DictInfo VSM object

This specification relates to the function:  
 `getDictInfos(options, cb)`

If the `options.filter.id` is properly defined and none of the ids used for 
filtering are BioPortal-related (meaning that they do not have the 
`data.bioontology.org/ontologies` as a substring), then `getDictInfos` 
returns an empty object result.

Otherwise, an example of a URL string that is being built and send to BioPortal 
is:
```
http://data.bioontology.org/ontologies/GO?display_context=false
```
If `options.filter.id` is empty or not properly defined, then we query all of
BioPortal's ontologies with:
```
http://data.bioontology.org/ontologies/?display_context=false
```

The `options.page` and `options.perPage` are used to trim the number of the
results. If these options are not properly defined, then the default values 
from the BioPortal API are used (*1* and *50* respectively).

After sending a query to ask for information about a specific ontology, the 
returned JSON result is mapped to a VSM dictInfo object. The mapping is fully 
detailed in the table below:

BioPortal ontology property | Type | Required | VSM dictInfo object property | Notes  
:---:|:---:|:---:|:---:|---
`@id` | URL | **YES** | `id` | the unique ontology URI
`acronym` | String | **YES** | `abbrev` | the unique ontology acronym
`name` | String | **YES** | `name` | the full name of the ontology

### Map BioPortal to Entry VSM object

This specification relates to the function:  
 `getEntries(options, cb)`

If the `options.filter.dictID` is properly defined and none of the dictIDs used 
for filtering are BioPortal-related (meaning that they do not have the 
`data.bioontology.org/ontologies` as a substring), then `getEntries` 
returns an empty object result.

Depending on the `options.filter.id` and `options.filter.dictID` properties and
following the vsm-dictionary parent class [specification](https://github.com/vsmjs/vsm-dictionary/blob/master/Dictionary.spec.md),
there can be only be 4 cases of queries that are send to BioPortal:

- Non proper `filter.id` and `filter.dictID` or `options.filter` is an 
empty object

By default we search for all terms in all ontologies in BioPortal:
```
http://data.bioontology.org/search?ontologies=&ontology_types=ONTOLOGY&pagesize=1&display_context=false
```
Note that because the query above has neither a search string, nor multiple 
ontologies to rank against, the returned results have no deterministic order. 

- Non proper `filter.id` but proper `filter.dictID` property

We use the following query to get all terms within a set of ontologies:
```
http://data.bioontology.org/search?ontologies=NCIT,GO&ontology_types=ONTOLOGY&pagesize=1&display_context=false
```
Also here, no sorting is done.

- Proper `filter.id` but non proper `filter.dictID` property

We use the following queries to find a term by id (without any given ontologies):
```
http://data.bioontology.org/search?q=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2FDOID_1909&ontologies=&require_exact_match=true&also_search_obsolete=true&display_context=false
http://data.bioontology.org/property_search?q=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2FDOID_1909&ontologies=&require_exact_match=true&display_context=false
```
Note that in case of querying for specific id(s), we ask also for obsolete terms
in the *search* endpoint but not in the *property_search* one, since it does not
support them.

Furthermore, because of multiple ontologies having terms with the same id, we 
never sort the returned results. Instead, we have implemented 
a workaround that infers the ontology abbreviation name from the id in some 
cases. In the case of multiple entries with the same id, the entry for which we 
can correctly infer their source ontology will be ranked first in the returned
result.

- Both proper `filter.id` and `filter.dictID` properties

We use the following query to find a term by id within any of the given 
ontologies:
```
http://data.bioontology.org/search?q=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2FDOID_1909&ontologies=BAO,DOID&require_exact_match=true&also_search_obsolete=true&display_context=false
http://data.bioontology.org/property_search?q=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2FDOID_1909&ontologies=BAO,DOID&require_exact_match=true&display_context=false
```
Same as the previous case, we never sort results (it's optional nonetheless) 
and the obsolete terms are also retrieved in the *search* query option.

So, after sending one query from the 4 categories above to BioPortal, the 
returned JSON result object includes a `collection` property which has as 
a value, an array of objects. Each object/element of that array is an entry 
which is mapped to a VSM entry object. The mapping is fully detailed in the 
tables below for the different endpoints:

- **/search** endpoint:  

BioPortal entry's property | Type | Required | VSM entry object property | Notes  
:---:|:---:|:---:|:---:|:---:
`@id` | URL | **YES** | `id` | the concept-ID
`links.ontology` | URL | **YES** | `dictID` | the unique identifier of the ontology
`definition` | Array | NO | `descr` | we map the first definition only
`synonym` | Array | NO | `terms[i].str` | we map the whole array, first element of `terms` array is an object with property `str` and value the `prefLabel`
`links.ontology` | URL | **YES** | `z.dictAbbrev` | the unique ontology acronym
`cui` | Array | NO | `z.cui` | Concept Unique Identifier
`semanticType` | Array | NO | `z.tui` | Type Unique Identifier
`obsolete` | Boolean | NO | `z.obsolete` | This z option is returned only when requesting for specific entry id(s)

- **/property_search** endpoint:

BioPortal entry's property | Type | Required | VSM entry object property | Notes  
:---:|:---:|:---:|:---:|:---:
`@id` | URL | **YES** | `id` | the property's ID
`links.ontology` | URL | **YES** | `dictID` | the unique identifier of the ontology
`definition` | Array | NO | `descr` | we map the first definition only
`label`, `labelGenerated` | Arrays | NO, YES | `terms[i].str` | we map the whole `label` array if it exists, otherwise the `labelGenerated` one (which *always* exists)
`links.ontology` | URL | **YES** | `z.dictAbbrev` | the unique ontology acronym

### Map BioPortal to Match VSM object

This specification relates to the function:  
 `getEntryMatchesForString(str, options, cb)`

If the `options.filter.dictID` is properly defined and none of the dictIDs used 
for filtering are BioPortal-related (meaning that they do not have the 
`data.bioontology.org/ontologies` as a substring), then `getEntryMatchesForString` 
returns an empty object result.

An example of a URL string that is being built and send to BioPortal is:
```
http://data.bioontology.org/search?q=melanoma&ontologies=RH-MESH,MCCL&page=1&pagesize=40&display_context=false
```

Note that every query is being duplicated by using also the *search_property* endpoint,
so we have at least 2 queries (URLs) per one string search.

The parameters are as follows:
- `str` maps to `q=str`
- `page` is the `options.page` and `pagesize` is `options.perPage`
- The `ontologies` part of the URL corresponds to the sub-dictionaries from 
where we want to get terms. This parameter is being built according to the 
values of `options.filter.dictID` and `options.sort.dictID` as well as the
[specification](https://github.com/vsmjs/vsm-dictionary/blob/master/Dictionary.spec.md)
of the vsm-dictionary parent class. Note that there can be cases where 4 URLs
are fired (simultaneously) during a string search to get results for preferred
dictionaries and all the rest for example (in each seperate case, both *search*
and *property_search* endpoints are queried).

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
object. The mapping is fully detailed in the tables below for the different 
endpoints:
        
- **/search** endpoint:  

BioPortal entry's property | Type | Required | VSM match object property | Notes  
:---:|:---:|:---:|:---:|:---:
`@id` | URL | **YES** | `id` | the concept-ID
`links.ontology` | URL | **YES** | `dictID` | the unique identifier of the ontology
`prefLabel` | String | **YES** | `str`,`terms[0].str` | the string representation of the term
`definition` | Array | NO | `descr` | we map the first definition only
`synonym` | Array | NO | `terms[i].str` | we map the whole array, first element of `terms` array is an object with property `str` and value the `prefLabel`
`links.ontology` | URL | **YES** | `z.dictAbbrev` | the unique ontology acronym
`cui` | Array | NO | `z.cui` | Concept Unique Identifier
`semanticType` | Array | NO | `z.tui` | Type Unique Identifier

- **/property_search** endpoint:  

BioPortal entry's property | Type | Required | VSM match object property | Notes  
:---:|:---:|:---:|:---:|:---:
`@id` | URL | **YES** | `id` | the concept-ID
`links.ontology` | URL | **YES** | `dictID` | the unique identifier of the ontology
`label`, `labelGenerated` | Arrays | NO, YES | `str`,`terms[0].str` | the string representation of the term: we map the first element of the `label` array if it exists, otherwise the first element of the `labelGenerated` one (which *always* exists)
`definition` | Array | NO | `descr` | we map the first definition only
`label`, `labelGenerated` | Arrays | NO, YES | `terms[i].str` | we map the whole `label` array if it exists, otherwise the `labelGenerated` one (which *always* exists)
`links.ontology` | URL | **YES** | `z.dictAbbrev` | the unique ontology acronym

## License

This project is licensed under the AGPL license - see [LICENSE.md](LICENSE.md).
