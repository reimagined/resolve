import { cli, commands } from '../constants'
import mergeArguments from '../merge_arguments'
import webpack from '../webpack'

export const command = 'start'
export const desc = commands.start
export const builder = yargs =>
  yargs
    .help('help')
    .option('inspect', cli.inspect)
    .option('print-config', cli.printConfig)
    .strict()

export const handler = argv =>
  webpack(
    mergeArguments(argv, {
      start: true
    })
  )
