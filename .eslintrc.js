module.exports = {
  extends: [require.resolve('@lxjx/preset-config/.eslintrc.js')],

  globals: {},

  rules: {
    'no-restricted-syntax': 'off',
    'no-bitwise': 'off',
    'no-useless-constructor': 'off',
    'no-empty-function': 'off',
  },
};
