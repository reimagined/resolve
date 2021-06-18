const babelrc = require('@internal/helpers').getBabelConfig({
  moduleType: 'cjs',
  moduleTarget: 'server',
  sourceType: 'js',
})

module.exports = require('babel-jest').default.createTransformer(babelrc)
