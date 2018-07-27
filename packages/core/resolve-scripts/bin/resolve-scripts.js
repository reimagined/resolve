#!/usr/bin/env node
require('source-map-support').install()

require('dotenv').config()

const commandList = require('../configs/command.list.json')
const command = process.argv[2]

if (commandList.hasOwnProperty(command)) {
  require('../dist/core/commands/' + command)
} else {
  require('../dist/core/commands/usage')
}
