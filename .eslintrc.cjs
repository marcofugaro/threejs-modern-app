module.exports = {
  env: {
    browser: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'prettier',
  ],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest',
  },
}
