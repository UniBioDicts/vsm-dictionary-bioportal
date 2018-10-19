const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const src  = path.resolve(__dirname, '../src');
const demo = path.resolve(__dirname, './');


module.exports = () => ({
  mode: 'none',

  devServer: {
    port: 3333,
    open: true
  },

  entry: src + '/DictionaryBioPortal.js',

  devtool: 'inline-source-map',

  module: {
    rules: [
      {
        test: /\.js$/,
        include: src,
        exclude: /(node_modules|^demo.+\.js)/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                // `esmodules: true` is necessary, as otherwise Babel causes
                // the error "class constructors must be invoked with |new|".
                // So it works only in modern browsers that support ES Modules.
                ['@babel/preset-env', { targets: { esmodules: true }}]
              ]
            }
          },
          {
            loader: 'text-transform-loader',
            options: {
              transformText: s =>  // Exclude this package, for the browser.
                s.replace(/require\('xmlhttprequest'\)/g, '{}')
            }
          }
        ]
      }
    ]
  },

  node: {
    fs: 'empty',
    child_process: 'empty'  // Extra safety against 'xmlhttprequest'-error.
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: demo + '/demo.html',
      inject: false
    }),
    new CopyWebpackPlugin([
      { from: demo + '/demoInBrowser.js' }
    ])
  ],

  output: {
    filename: 'bundle.js',  // Used by HtmlWebpackPlugin.
    library: 'VsmDictionaryBioPortal',  // } => global variable for browsers.
    libraryTarget: 'window'
  }
});
