import testCafeRunner from '../utils/test_cafe_runner'

import {
  cli,
  commands,
  defaults,
  defaultsTitle,
  env,
  envTitle
} from '../configs/strings'
import table from '../utils/table'

export const command = 'test:functional'
export const desc = commands.testFunctional
export const builder = yargs =>
  yargs
    .help('help')
    .epilogue(
      `${envTitle}:\n` +
        `${table([env.BROWSER])}\n` +
        `${defaultsTitle}:\n` +
        `${defaults}`
    )
    .option('browser', cli.browser)

export const handler = argv => testCafeRunner(argv)
