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

  makeDemoBioPortal();
}

function makeDemoBioPortal() {

  var apiKey = '5904481f-f6cb-4c71-94d8-3b775cf0f19e';
  var dict = new VsmDictionaryBioPortal({apiKey: apiKey});
  this.urlRegex = /http:\/\/data.bioontology.org\/ontologies\//g;
  this.ontoURL = 'http://data.bioontology.org/ontologies/';

  var elems = createDemoPanel({
    title: 'Demo of the \'getMatchesForString()\' function:<br>',
    dictionary: dict,
    dictIDFilter: 'RH-MESH,MCCL,CHEAR',
    dictIDSorter: 'CHEAR',
    z: 'dictAbbrev',
    pageNumber: 1,
    pageSize: 40,
    initialSearchStr: 'melanoma',
  });

  elems.input.focus();
  elems.input.setSelectionRange(0, elems.input.value.length);
}

function createDemoPanel(opt) {
  var parent = document.getElementById('demo');
  if (!parent) return;

  var title = createTitle();
  var stringInput = createStringInput();
  var dictFilterInput = createDictFilterInput();
  var dictSorterInput = createDictSorterInput();
  var zFilterInput = createZFilterInput();
  var pageNumberInput = createPageNumberInput();
  var pageSizeInput = createPageSizeInput();
  var output = createOutput();

  parent.appendChild(title);
  parent.appendChild(stringInput);
  parent.appendChild(dictFilterInput);
  parent.appendChild(dictSorterInput);
  parent.appendChild(zFilterInput);
  parent.appendChild(pageNumberInput);
  parent.appendChild(pageSizeInput);
  parent.appendChild(output);

  stringInput.addEventListener('input', function () {
    getNewMatches(opt.dictionary, this.value, searchOptionsFunc(),
      stringInput, dictFilterInput, dictSorterInput, zFilterInput,
      pageNumberInput, pageSizeInput, output);
  });

  getNewMatches(opt.dictionary, stringInput.value, searchOptionsFunc(),
    stringInput, dictFilterInput, dictSorterInput, zFilterInput,
    pageNumberInput, pageSizeInput, output);

  return {
    input: stringInput
  };

  function createTitle() {
    var title = document.createElement('div');

    title.innerHTML = '&bull; ' + opt.title + '<br>';
    title.setAttribute('style', 'margin: 18px 0 2px -8px; font-size: 12px;');

    return title;
  }

  function createStringInput() {
    var stringInput = document.createElement('input');

    stringInput.setAttribute('title', 'String used for searching');
    stringInput.setAttribute('value', opt.initialSearchStr);

    return stringInput;
  }

  function createDictFilterInput() {
    var dictFilterInput = document.createElement('input');

    dictFilterInput.setAttribute('style', 'margin: 0 0 0 10px; width: 200px');
    dictFilterInput.setAttribute('placeholder', 'dictID');
    dictFilterInput.setAttribute('title','dictAbbrev(s), comma separated, used for filtering');
    dictFilterInput.value = opt.dictIDFilter;
    dictFilterInput.addEventListener('input', function () {
      stringInput.dispatchEvent(new Event('input', {}));  // Make the main input fire.
    });

    return dictFilterInput;
  }

  function createDictSorterInput() {
    var dictSorterInput = document.createElement('input');

    dictSorterInput.setAttribute('style', 'margin: 0 0 0 10px; width: 200px');
    dictSorterInput.setAttribute('placeholder', 'dictID');
    dictSorterInput.setAttribute('title','preferred dictAbbrev(s), comma separated, used for sorting');
    dictSorterInput.value = opt.dictIDSorter;
    dictSorterInput.addEventListener('input', function () {
      stringInput.dispatchEvent(new Event('input', {}));  // Make the main input fire.
    });

    return dictSorterInput;
  }

  function createZFilterInput() {
    var zFilterInput = document.createElement('input');

    zFilterInput.setAttribute('style', 'margin: 0 0 0 10px; width: 100px');
    zFilterInput.setAttribute('placeholder', 'z');
    zFilterInput.setAttribute('title','z-properties, comma separated, to be kept in the ' +
      'result (if left empty, all properties will be kept)');
    zFilterInput.value = opt.z;
    zFilterInput.addEventListener('input', function () {
      stringInput.dispatchEvent(new Event('input', {})); // Make the main input fire.
    });

    return zFilterInput;
  }

  function createPageNumberInput() {
    var pageNumberInput = document.createElement('input');
    pageNumberInput.setAttribute('style', 'margin: 0 0 0 10px; width: 50px');
    pageNumberInput.setAttribute('placeholder', 'page');
    pageNumberInput.setAttribute('type', 'number');
    pageNumberInput.setAttribute('min', '1');
    pageNumberInput.setAttribute('max', '100');

    pageNumberInput.setAttribute('title','page number requested (1-100)');
    pageNumberInput.value = opt.pageNumber;
    pageNumberInput.addEventListener('input', function () {
      if (pageNumberInput.value < 1 || pageNumberInput.value > 100)
        pageNumberInput.value = opt.pageNumber;
      stringInput.dispatchEvent(new Event('input', {}));  // Make the main input fire.
    });

    return pageNumberInput;
  }

  function createPageSizeInput() {
    var pageSizeInput = document.createElement('input');
    pageSizeInput.setAttribute('style', 'margin: 0 0 0 10px; width: 50px');
    pageSizeInput.setAttribute('placeholder', 'perPage');
    pageSizeInput.setAttribute('type', 'number');
    pageSizeInput.setAttribute('min', '1');
    pageSizeInput.setAttribute('max', '100');

    pageSizeInput.setAttribute('title','page size requested (1-100)');
    pageSizeInput.value = opt.pageSize;
    pageSizeInput.addEventListener('input', function () {
      if (pageSizeInput.value < 1 || pageSizeInput.value > 100)
        pageSizeInput.value = opt.pageSize;
      stringInput.dispatchEvent(new Event('input', {}));  // Make the main input fire.
    });

    return pageSizeInput;
  }

  function createOutput() {
    var output = document.createElement('pre');
    output.setAttribute('style',
      'background-color: #fafafa;  border: 1px solid #ddd; '+
      'color: #333;  font-size: 12px;  font-family: Inconsolata, monospace;' +
      'width: 90%;  min-height: 24px;  margin: 2px 0 0 0;  padding: 0 0 1px 0;' +
      'white-space: pre-wrap;'
    );

    return output;
  }

  function searchOptionsFunc() {
    return {
      filter: {
        ...(dictFilterInput.value) &&
        {
          dictID: dictFilterInput.value.split(',').map(
            dictAbbrev => this.ontoURL.concat(dictAbbrev))
        },
        ...(!dictFilterInput.value) &&
        {
          dictID: []
        }
      },
      sort: {
        ...(dictSorterInput.value) &&
        {
          dictID: dictSorterInput.value.split(',').map(
            dictAbbrev => this.ontoURL.concat(dictAbbrev))
        },
        ...(!dictSorterInput.value) &&
        {
          dictID: []
        }
      },
      z: (zFilterInput.value === '') ? true : zFilterInput.value.split(','),
      page: parseInt(pageNumberInput.value),
      perPage: parseInt(pageSizeInput.value)
    };
  }
}

function getNewMatches(dict, str, options, stringInput,
  dictFilterInput, dictSorterInput, zFilterInput,
  pageNumberInput, pageSizeInput, output) {

  //console.log(options);
  dict.getMatchesForString(str, options, function (err, res) {
    if (err)  { output.innerHTML = err;  return }
    for (var i = 0, s = '';  i < res.items.length;  i++) {
      s += matchToString(res.items[i]) + '\n';
    }

    // Place the results, but only if the inputs haven't changed yet
    if (
      stringInput.value === str  &&
      dictFilterInput.value === options.filter.dictID.toString().
        replace(this.urlRegex,'') &&
      dictSorterInput.value === options.sort  .dictID.toString().
        replace(this.urlRegex,'')  &&
      (Array.isArray(options.z)  &&  zFilterInput.value === options.z.toString()
        ||  zFilterInput.value === '') &&
      parseInt(pageNumberInput.value) === options.page &&
      parseInt(pageSizeInput.value) === options.perPage
    ) {
      //output.innerHTML = JSON.stringify(res, null, 4);
      output.innerHTML = s;
    } else console.log('Inputs have changed, so no new output');
    
  });
}

function matchToString(m) {
  var n = '</span>';
  var arr = [
    'type:\'<span style="font-weight:800; color:#FF0000">' + m.type + n,
    'dictID:\'<span style="font-weight:800; color:#6A5ACD">' + m.dictID + n,
    'id:\'<span style="font-weight:800; color:#000000">' + m.id  + n,
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
