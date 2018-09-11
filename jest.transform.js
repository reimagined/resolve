const babelrc = require('./babel.config').getConfig({
  moduleType: 'cjs',
  moduleTarget: 'server'
})

module.exports = require('babel-jest').createTransformer(babelrc)
