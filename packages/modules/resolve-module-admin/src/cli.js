#!/usr/bin/env node

import yargs from 'yargs'

yargs
  .commandDir('commands')
  .option('api-url', {
    alias: 'url',
    default: 'http://localhost:3000/api',
  })
  .recommendCommands()
  .strict()
  .demandCommand(1, '')
  .help()
  .showHelpOnFail(true)
  .fail((msg, err) => {
    if (msg) {
      //eslint-disable-next-line no-console
      console.error(msg)
    }
    if (err) {
      //eslint-disable-next-line no-console
      console.error(err.message)
    }
    process.exit(1)
  })
  .parse()
