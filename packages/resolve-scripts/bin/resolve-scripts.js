#!/usr/bin/env node
require('source-map-support').install()

require('dotenv').config()

// eslint-disable-next-line no-unused-expressions
require('yargs')
  .usage('resolve-scripts <command> [options]')
  .command(require('../dist/core/commands/build'))
  .command(require('../dist/core/commands/start'))
  .command(require('../dist/core/commands/dev'))
  .command(require('../dist/core/commands/test'))
  .command(require('../dist/core/commands/test_functional'))
  .help('help').argv
