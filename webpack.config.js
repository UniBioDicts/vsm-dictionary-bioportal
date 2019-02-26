/*
This Webpack-config builds a version of VsmDictionaryBioPortal that can be
loaded in browsers, where it can be accessed as a global variable.
*/

const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');


const src  = path.resolve(__dirname, './src');
const dist = path.resolve(__dirname, './dist');
const addSourceMap = false;


module.exports = (env = {}) => ({

  mode: 'production',

  entry: src + '/DictionaryBioPortal.js',

  devtool: addSourceMap ? 'hidden-source-map' : false,

  module: {
    rules: [
      { test: /\.js$/,
        include: src,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [ '@babel/preset-env', { targets: { esmodules: true } } ] ] }
        }
      }
    ]
  },

  node: {
    fs: 'empty',
    child_process: 'empty'
  },

  plugins: [ new CleanWebpackPlugin([ dist ]) ],

  optimization: {
    minimizer: [ new TerserPlugin({
      sourceMap: addSourceMap,
      parallel: true,
      terserOptions: { ie8: false }
    }) ]
  },

  output: {
    path: dist,
    filename: 'vsm-dictionary-bioportal.min.js',
    library: 'VsmDictionaryBioPortal',
    libraryTarget: 'var'
  }
});
