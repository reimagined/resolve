const fs = require('fs')
const path = require('path')

const babelrc = JSON.parse(fs.readFileSync(path.resolve(__dirname, '.babelrc')))

module.exports = require('babel-jest').createTransformer(babelrc)
