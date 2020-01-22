module.exports = {
  'env': {
    'es6': true,
    'node': true
  },
  'extends': 'eslint:recommended',
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly'
  },
  'parserOptions': {
    'ecmaVersion': 2018,
    'sourceType': 'module'
  },
  'plugins': ['promise'],
  'rules': {
    'arrow-parens': ['error', 'as-needed'],
    'space-before-function-paren': ['error', 'always'],
    'one-var': ['error', 'always'],
    'dot-location': ['error', 'property'],
    'eqeqeq': ['error', 'always'],
    'no-console': 0,
    'no-multi-spaces': [2, {
      exceptions: {
        'VariableDeclarator': true,
        'ImportDeclaration': true
      }
    }],
    'indent': ['error', 2, {
      'VariableDeclarator': {
        'var': 2,
        'let': 2,
        'const': 3
      }
    }],
    'brace-style': [2, 'stroustrup', { 'allowSingleLine': true }],
    'prefer-arrow-callback': ['error'],
    'promise/always-return': 'error',
    'promise/no-return-wrap': 'error',
    'promise/param-names': 'error',
    'promise/catch-or-return': 'error',
    'promise/no-nesting': 'warn',
    'promise/no-promise-in-callback': 'warn',
    'promise/no-callback-in-promise': 'warn',
    'promise/avoid-new': 'warn',
    'promise/no-new-statics': 'error',
    'promise/no-return-in-finally': 'warn',
    'promise/valid-params': 'warn'
  }
}
