module.exports = {
  root: true,
  extends: '@adobe/helix',
  env: {
    browser: true,
    mocha: true,
  },
  rules: {
    // allow reassigning param
    'no-param-reassign': [2, { props: false }],
    'linebreak-style': ['error', 'unix'],
    'no-await-in-loop': 0,
    'no-return-assign': ['error', 'except-parens'],
    'max-statements-per-line': ['error', { max: 2 }],
    'import/extensions': ['error', {
      js: 'always',
    }],
    'no-unused-expressions': 0,
    'header/header': 0,
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
};
