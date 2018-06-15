import { cli, commands } from '../constants'
import mergeArguments from '../merge_arguments'
import webpack from '../webpack'

export const command = 'start'
export const desc = commands.build
export const builder = yargs =>
  yargs
    .help('help')
    .option('inspect', cli.inspect)
    .option('print-config', cli.printConfig)

export const handler = argv =>
  webpack(
    mergeArguments(argv, {
      start: true
    })
  )
