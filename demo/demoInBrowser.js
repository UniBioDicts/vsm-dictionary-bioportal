/*
NOTE!: This only works with Webpack.
Start the demo by running `npm run demo`.

The Webpack development-server bundles all modules, which are Node.js-based,
so they can run in the browser instead. The bundled JS-script will expose a
global variable `VsmDictionaryBioPortal` that can be accessed by this script.

Webpack serves the bundle in-memory (so, writing no files to disk), along with
an updated demo.html webpage that loads both that bundle and this demo-script.

In the browser, Webpack lets us access `VsmDictionaryBioPortal` as a global
variable.
*/

runDemo();

function runDemo() {
  // Remove the warning message of running this demo without Webpack.
  if (VsmDictionaryBioPortal) document.getElementById('demo').innerHTML = '';

  makeDemoRemote();
}

function makeDemoRemote() {

  var apiKey = '5904481f-f6cb-4c71-94d8-3b775cf0f19e';
  var dict = new VsmDictionaryBioPortal({apiKey: apiKey});

  var elems = createDemoPanel({
    title: 'Demo of the \'getMatchesForString()\' function:<br>',
    dictionary: dict,
    dictIDFilter: 'RH-MESH,MCCL,CHEAR',
    dictIDSorter: 'CHEAR',
    z: 'dictURL',
    matchesMaxCount: 40,
    pageNumber: 1,
    initialSearchStr: 'melanoma',
  });

  elems.input.focus();
  elems.input.setSelectionRange(0, elems.input.value.length);
}

function createDemoPanel(opt) {
  var parent = document.getElementById('demo');
  if (!parent) return;

  var title = document.createElement('div');
  var stringInput = document.createElement('input');
  var dictFilterInput = document.createElement('input');
  var dictSorterInput = document.createElement('input');
  var zFilterInput = document.createElement('input');
  var output = document.createElement('pre');

  title.innerHTML = '&bull; ' + opt.title + '<br>';
  title.setAttribute('style', 'margin: 18px 0 2px -8px; font-size: 12px;');

  stringInput.setAttribute('title', 'String used for searching');

  dictFilterInput.setAttribute('style', 'margin: 0 0 0 10px; width: 200px');
  dictFilterInput.setAttribute('placeholder', 'dictID');
  dictFilterInput.setAttribute('title','dictIDs, comma seperated, used for filtering');
  dictFilterInput.value = opt.dictIDFilter;
  dictFilterInput.addEventListener('input', function () {
    stringInput.dispatchEvent(new Event('input', {}));  // Make the main input fire.
  });

  dictSorterInput.setAttribute('style', 'margin: 0 0 0 10px; width: 200px');
  dictSorterInput.setAttribute('placeholder', 'dictID');
  dictSorterInput.setAttribute('title','preferred dictIDs, comma seperated, used for sorting');
  dictSorterInput.value = opt.dictIDSorter;
  dictSorterInput.addEventListener('input', function () {
    stringInput.dispatchEvent(new Event('input', {}));  // Make the main input fire.
  });

  zFilterInput.setAttribute('style', 'margin: 0 0 0 10px; width: 100px');
  zFilterInput.setAttribute('placeholder', 'z');
  zFilterInput.setAttribute('title','z-properties, comma seperated, to be kept in the ' +
    'result (if left empty, all properties will be kept)');
  zFilterInput.value = opt.z;
  zFilterInput.addEventListener('input', function () {
    stringInput.dispatchEvent(new Event('input', {})); // Make the main input fire.
  });

  output.setAttribute('style',
    'background-color: #fafafa;  border: 1px solid #ddd; '+
    'color: #333;  font-size: 12px;  font-family: Inconsolata, monospace;' +
    'width: 90%;  min-height: 24px;  margin: 2px 0 0 0;  padding: 0 0 1px 0;' +
    'white-space: pre-wrap;'
  );

  parent.appendChild(title);
  parent.appendChild(stringInput);
  parent.appendChild(dictFilterInput);
  parent.appendChild(dictSorterInput);
  parent.appendChild(zFilterInput);
  parent.appendChild(output);

  stringInput.addEventListener('input', function () {
    getNewMatches(opt.dictionary, this.value, searchOptionsFunc(),
      stringInput, dictFilterInput, dictSorterInput, zFilterInput, output);
  });

  stringInput.setAttribute('value', opt.initialSearchStr);
  getNewMatches(opt.dictionary, stringInput.value, searchOptionsFunc(),
    stringInput, dictFilterInput, dictSorterInput, zFilterInput, output);

  return {
    input: stringInput,
    dictFilterInput: dictFilterInput,
    dictSorterInput: dictSorterInput
  };

  function searchOptionsFunc() {
    return {
      filter: {
        dictID: dictFilterInput.value.split(',')
      },
      sort: {
        dictID: dictSorterInput.value.split(',')
      },
      z: (zFilterInput.value === '') ? true : zFilterInput.value.split(','),
      page: opt.pageNumber,
      perPage: opt.matchesMaxCount
    };
  }
}

function getNewMatches(dict, str, options, stringInput,
  dictFilterInput, dictSorterInput, zFilterInput, output
) {

  dict.getMatchesForString(str, options, function (err, res) {
    if (err)  { output.innerHTML = err;  return }
    for (var i = 0, s = '';  i < res.items.length;  i++) {
      s += matchToString(res.items[i]) + '\n';
    }

    // Place the results, but only if the inputs haven't changed yet
    if (
      stringInput.value === str  &&
      dictFilterInput.value === options.filter.dictID.toString()  &&
      dictSorterInput.value === options.sort  .dictID.toString()  &&
      (Array.isArray(options.z)  &&  zFilterInput.value === options.z.toString()
        ||  zFilterInput.value === '')
    ) {
      //output.innerHTML = JSON.stringify(res, null, 4);
      output.innerHTML = s;
    } //else console.log('Inputs have changed, so no new output')

  });
}

function matchToString(m) {
  var n = '</span>';
  var arr = [
    'type:\''   + m.type,
    'dictID:\'' + m.dictID,
    'id:\'<span style="font-weight:800; color:#737373">' + m.id  + n,
    'str:\'<span style="font-weight:800; color:#a00">'   + m.str + n,
  ];
  if (m.style)  arr.push('style:\'<span style="color:#66e">' + m.style + n);

  // For compressed output, remove html tags from the description
  if (m.descr)  arr.push('descr:\'<span style="color:#772">' +
    m.descr.replace(/<(.|\n)*?>/g, '') + n);
  if (m.z    )  arr.push('z:\'<span style="color:#db8">' +
    JSON.stringify(m.z) + n);
  if (m.terms)  arr.push('terms:<span style="color:#bbb">' +
    JSON.stringify(m.terms)
      .replace(/"str"/g, 'str')
      .replace(/"style"/g, 'style')
      .replace(/"descr"/g, 'descr') +
    n);

  return '{' + arr.join('\', ') + '\'}';
}
