#!/usr/bin/env node

import yargs from 'yargs'

yargs
  .commandDir('commands')
  .option('api-url', {
    alias: 'url',
    default: 'http://localhost:3000/api'
  })
  .recommendCommands()
  .strict()
  .demandCommand(1, '')
  .help()
  .showHelpOnFail(true)
  .fail((msg, err) => {
    if (msg) {
      log.error(msg)
    }
    if (err) {
      log.error(err.message)
    }
    process.exit(1)
  })
  .parse()
