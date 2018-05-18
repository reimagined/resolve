import { env, cli, commands } from '../constants'
import testCafeRunner from '../test_cafe_runner'
import table from '../table'

export const command = 'test:functional'
export const desc = commands.testFunctional
export const builder = yargs =>
  yargs
    .help('help')
    .epilogue(`${env.title}:\r\n${table([env.options.TESTCAFE_BROWSER])}`)
    .option('browser', cli.browser)

export const handler = argv => testCafeRunner(argv)
