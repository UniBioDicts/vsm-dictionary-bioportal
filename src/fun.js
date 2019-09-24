module.exports = { hasProperEntrySortProperty, hasProperFilterDictIDProperty,
  hasProperFilterIDProperty, hasProperPageProperty, hasPagePropertyEqualToOne,
  hasProperPerPageProperty, hasProperSortDictIDProperty, str_cmp, deepClone,
  fixedEncodeURIComponent, isJSONString, getLastPartOfURL, removeDuplicates };

function getLastPartOfURL(strURL) {
  return strURL.split('/').pop();
}

function fixedEncodeURIComponent(str) {
  // encode also characters: !, ', (, ), and *
  return encodeURIComponent(str).replace(/[!'()*]/g,
    c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function str_cmp(a, b, caseMatters = false) {
  if (!caseMatters) {
    a = a.toLowerCase();
    b = b.toLowerCase();
  }
  return a < b
    ? -1
    : a > b
      ? 1
      : 0;
}

function isJSONString(str) {
  try {
    let json = JSON.parse(str);
    return (json && typeof json === 'object');
  } catch (e) {
    return false;
  }
}

function hasProperFilterDictIDProperty(options) {
  return options.hasOwnProperty('filter')
    && options.filter.hasOwnProperty('dictID')
    && Array.isArray(options.filter.dictID)
    && options.filter.dictID.length !== 0;
}

function hasProperFilterIDProperty(options) {
  return options.hasOwnProperty('filter')
    && options.filter.hasOwnProperty('id')
    && Array.isArray(options.filter.id)
    && options.filter.id.length !== 0;
}

function hasProperSortDictIDProperty(options) {
  return options.hasOwnProperty('sort')
    && options.sort.hasOwnProperty('dictID')
    && Array.isArray(options.sort.dictID)
    && options.sort.dictID.length !== 0;
}

function hasProperPageProperty(options) {
  return options.hasOwnProperty('page')
    && Number.isInteger(options.page)
    && options.page >= 1;
}

function hasPagePropertyEqualToOne(options) {
  return options.hasOwnProperty('page')
    && Number.isInteger(options.page)
    && options.page === 1;
}

function hasProperPerPageProperty(options) {
  return options.hasOwnProperty('perPage')
    && Number.isInteger(options.perPage)
    && options.perPage >= 1;
}

function hasProperEntrySortProperty(options) {
  return options.hasOwnProperty('sort')
    && typeof options.sort === 'string'
    && (options.sort === 'dictID'
      || options.sort === 'id'
      || options.sort === 'str'
    );
}
/** If you do not use Dates, functions, undefined, Infinity, RegExps, Maps,
    Sets, Blobs, FileLists, ImageDatas, sparse Arrays, Typed Arrays or other
    complex types within your object, a very simple one liner to deep clone
    an object is the function below!
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function removeDuplicates(arr) {
  return [...new Set(arr)];
}