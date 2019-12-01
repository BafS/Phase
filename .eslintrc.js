module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'react-app',
    'plugin:@typescript-eslint/recommended',
    'airbnb-base',
  ],
  rules: {
    'max-len': ['error', { 'code': 120 }],
    quotes: ['warn', 'single'],
    radix: 0,
    'no-plusplus': 0,
    'no-param-reassign': 0,
    'no-new-func': 0,
    'import/no-unresolved': 0,
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/indent': ['error', 2],
  },
  env: {
    browser: true,
    // 'node': true
  }
};
