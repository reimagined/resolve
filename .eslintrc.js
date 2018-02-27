module.exports = {
  env: {
    node: true,
    jest: true,
    es6: true
  },
  extends: 'react-app',
  parserOptions: {
    ecmaFeature: {
      jsx: true
    }
  },
  plugins: ['react', 'jsx-a11y', 'import'],
  rules: {
    'func-names': 'off',
    'no-underscore-dangle': 'off',
    'import/no-unresolved': 'off',
    'comma-dangle': ['error', 'never'],
    'no-plusplus': 'off',
    'jsx-a11y/href-no-hash': 'off',
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'no-param-reassign': ['error', { props: false }],
    'new-cap': ['error', { capIsNew: false }],
    'no-mixed-operators': [
      'error',
      {
        allowSamePrecedence: true
      }
    ],
    'object-curly-spacing': ['error', 'always'],
    'max-len': [
      'error',
      {
        code: 100
      }
    ],
    'no-console': ['error']
  }
}
