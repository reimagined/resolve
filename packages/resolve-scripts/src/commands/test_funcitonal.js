import testCafeRunner from '../testCafeRunner'

import { commands } from '../configs/strings'

export const command = 'test:functional'
export const desc = commands.testFunctional
export const builder = yargs => yargs.help('help')

export const handler = argv => testCafeRunner(argv)
