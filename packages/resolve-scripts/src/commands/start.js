import table from '../utils/table'

import {
  commands,
  cli,
  env,
  envTitle,
  customEnvText,
  customEnvTitle,
  defaults,
  defaultsTitle
} from '../configs/strings'
import webpack from '../webpack'

export const command = 'start'
export const desc = commands.build
export const builder = yargs =>
  yargs
    .help('help')
    .epilogue(
      `${envTitle}:\n` +
        `${table([env.INSPECT_HOST, env.INSPECT_PORT])}\n` +
        `${customEnvTitle}:\n` +
        `  ${customEnvText}\n\n` +
        `${defaultsTitle}:\n` +
        `${defaults}`
    )
    .option('inspect', cli.inspect)
    .option('print-config', cli.printConfig)

export const handler = argv =>
  webpack(argv, {
    START: 'true',
    WATCH: 'false',
    BUILD: 'false'
  })
