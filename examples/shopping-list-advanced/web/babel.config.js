module.exports = function(api) {
  api.cache(true)
  return {
    "presets": [
      "@babel/preset-env",
      "@babel/preset-react"
    ],
    "plugins": [
      "@babel/plugin-proposal-class-properties",
      "@babel/plugin-proposal-export-default-from",
      "@babel/plugin-proposal-export-namespace-from",
      "@babel/plugin-transform-runtime",
      ["babel-plugin-module-resolver", {
        "root": ["."],
        "alias": {
          "@shopping-list-advanced/ui": "../ui"
        }
      }]
    ]
  }
}

