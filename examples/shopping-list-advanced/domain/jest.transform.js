const babelrc = require('../babel.config')({
  cache: { forever: () => {} }
})

module.exports = require('babel-jest').createTransformer(babelrc)
