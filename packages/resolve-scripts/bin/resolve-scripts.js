#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const JSON5 = require('json5')

require('babel-polyfill')
require('dotenv').config()

function requireJSON(fileName) {
  const filePath = path.extname(fileName) === '' ? fileName + '.json' : fileName
  try {
    let json = fs.readFileSync(filePath, 'utf8')
    if (json.charCodeAt(0) === 0xfeff) {
      json = json.slice(1)
    }
    return JSON5.parse(json)
  } catch (error) {
    error.message = filePath + ': ' + error.message
    throw error
  }
}

require.extensions['.json'] = function(module, fileName) {
  module.exports = requireJSON(fileName)
}

module.exports.requireJSON = requireJSON

// eslint-disable-next-line
require('yargs')
  .usage('resolve-scripts <command> [options]')
  .commandDir(path.resolve(__dirname, '..', 'dist/commands'))
  .help('help').argv
