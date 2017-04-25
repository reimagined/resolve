module.exports = {
    "env": {
        "node": true,
        "mocha": true,
        "es6": true
    },
    "extends": "airbnb-base",
    "plugins": [
        "import"
    ],
    "rules": {
        "indent": ["error", 4, { "SwitchCase": 1 }],
        "func-names": "off",
        "no-underscore-dangle": [
            "error", {
                "allowAfterThis": true,
                "allow": ["__aggregateId", "__type"]
            }
        ],
        "import/no-unresolved": ["error", { "ignore": ["react"] }],
        "comma-dangle": ["error", "never"],
        "no-plusplus": "off",
        "import/no-extraneous-dependencies": ["error", { "devDependencies": true }],
        "no-param-reassign": ["error", { "props": false }],
        "new-cap": ["error", { "capIsNew": false }],
        "no-mixed-operators": ["error", {
            "allowSamePrecedence": true
        }]
    }
};
