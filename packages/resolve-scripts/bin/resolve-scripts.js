#!/usr/bin/env node
const path = require('path')

require('babel-polyfill')
require('dotenv').config()

// eslint-disable-next-line
require('yargs')
  .usage('resolve-scripts <command> [options]')
  .commandDir(path.resolve(__dirname, '..', 'dist/core/commands'))
  .help('help').argv
