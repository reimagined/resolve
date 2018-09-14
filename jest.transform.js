const babelrc = require('./babel.compile').getConfig({
  moduleType: 'cjs',
  moduleTarget: 'server'
})

module.exports = require('babel-jest').createTransformer(babelrc)
