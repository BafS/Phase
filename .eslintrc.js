module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['plugin:@typescript-eslint/recommended', 'airbnb-base'],
  rules: {
    quotes: ["warn", "single"],
    radix: 0,
    'no-plusplus': 0,
    'no-param-reassign': 0,
    'no-new-func': 0,

    '@typescript-eslint/indent': ['error', 2],
  },
  env: {
    browser: true,
    // "node": true
  }
};
