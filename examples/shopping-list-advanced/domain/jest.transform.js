const babelrc = require('../babel.config')({
  cache: function() {}
})

module.exports = require('babel-jest').createTransformer(babelrc)
