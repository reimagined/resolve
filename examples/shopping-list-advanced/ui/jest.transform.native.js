const babelrc = {
  babelrc: false,
  presets: ['babel-preset-expo']
}

module.exports = require('babel-jest').createTransformer(babelrc)
