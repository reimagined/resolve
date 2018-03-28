import testCafeRunner from '../test_cafe_runner'
import table from '../table'

const env = require('../../../configs/env.list.json')
const commands = require('../../../configs/command.list.json')
const cli = require('../../../configs/cli.list.json')
Object.keys(cli).forEach(key => (cli[key].default = undefined))

export const command = 'test:functional'
export const desc = commands.testFunctional
export const builder = yargs =>
  yargs
    .help('help')
    .epilogue(`${env.title}:\r\n${table([env.options.TESTCAFE_BROWSER])}`)
    .option('browser', cli.browser)

export const handler = argv => testCafeRunner(argv)
