import { cli, commands } from '../constants'
import testCafeRunner from '../test_cafe_runner'
import mergeArguments from '../merge_arguments'

export const command = 'test:functional'
export const desc = commands.testFunctional
export const builder = yargs =>
  yargs.help('help').option('browser', cli.browser)

export const handler = argv =>
  testCafeRunner(
    mergeArguments(argv, {
      test: true
    })
  )
