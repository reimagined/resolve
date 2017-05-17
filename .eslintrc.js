module.exports = {
    env: {
        node: true,
        mocha: true,
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
        indent: ['error', 4, { SwitchCase: 1 }],
        'func-names': 'off',
        'no-underscore-dangle': 'off',
        'import/no-unresolved': ['error', { ignore: ['react'] }],
        'comma-dangle': ['error', 'never'],
        'no-plusplus': 'off',
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
        'arrow-parens': [
            'error',
            'as-needed',
            {
                requireForBlockBody: true
            }
        ],
        'max-len': [
            'error',
            {
                code: 100
            }
        ],
        'space-before-function-paren': [
            'error',
            {
                anonymous: 'always',
                named: 'never',
                asyncArrow: 'always'
            }
        ]
    }
};
