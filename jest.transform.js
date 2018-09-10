const babelrc = require('./babel.config')({
  cache: {
    using: () => {}
  }
})

module.exports = require('babel-jest').createTransformer(babelrc)
