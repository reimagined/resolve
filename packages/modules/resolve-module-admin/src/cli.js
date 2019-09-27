#!/usr/bin/env node

import yargs from 'yargs'

yargs
  .commandDir('commands')
  .option('api-url', {
    alias: 'url',
    default: 'http://localhost:3000/api'
  })
  .parse()
