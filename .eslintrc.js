module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
    mocha: true
  },
  globals: {
    VsmDictionaryBioPortal: true,
  },
  parserOptions: {
    ecmaVersion: 2018
  },
  extends: 'eslint:recommended',
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always', { 'omitLastInOneLineBlock': true }],
    'arrow-parens': ['error', 'as-needed'],
    'no-console': 'off',
    'keyword-spacing': 'error',
    'max-len': ['error', {
      code: 80,
      tabWidth: 2,
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreComments: false,
      // Allow a trailing punctuation mark at pos. 81, and a '.' or ';' at 82.
      ignorePattern: '^.{0,80}[^a-zA-Z0-9][.;]?$'
    }]
  }
};
