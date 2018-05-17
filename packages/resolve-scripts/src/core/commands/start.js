import { env, cli, commands } from '../constants'
import webpack from '../webpack'
import table from '../table'

export const command = 'start'
export const desc = commands.build
export const builder = yargs =>
  yargs
    .help('help')
    .epilogue(
      `${env.title}:\r\n` +
        `${table([env.options.INSPECT_HOST, env.options.INSPECT_PORT])}\r\n` +
        `${env.custom.title}:\r\n` +
        `  ${env.custom.text}`
    )
    .option('inspect', cli.inspect)
    .option('print-config', cli.printConfig)

export const handler = argv =>
  webpack(argv, {
    START: 'true'
  })
