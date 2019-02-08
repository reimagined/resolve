const babelrc = require('@internal/helpers').getBabelConfig({
  moduleType: 'cjs',
  moduleTarget: 'server'
})

module.exports = require('babel-jest').createTransformer(babelrc)
