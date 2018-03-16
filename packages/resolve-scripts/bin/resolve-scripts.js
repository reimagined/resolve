#!/usr/bin/env node
var path = require('path')

require('babel-polyfill')

// eslint-disable-next-line
require('yargs')
  .usage('resolve-scripts <command> [options]')
  .commandDir(path.resolve(__dirname, '..', 'dist/commands'))
  .help('help').argv
