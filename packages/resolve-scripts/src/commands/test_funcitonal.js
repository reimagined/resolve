import testCafeRunner from '../utils/test_cafe_runner'
import table from '../utils/table'

import {
  cli,
  commands,
  defaults,
  defaultsTitle,
  env,
  envTitle
} from '../configs/strings'

export const command = 'test:functional'
export const desc = commands.testFunctional
export const builder = yargs =>
  yargs
    .help('help')
    .epilogue(
      `${envTitle}:\n` +
        `${table([env.TESTCAFE_BROWSER])}\n` +
        `${defaultsTitle}:\n` +
        `${defaults}`
    )
    .option('browser', cli.browser)

export const handler = argv => testCafeRunner(argv)
