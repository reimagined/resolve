import { env, cli, commands } from '../constants'
import mergeArguments from '../merge_arguments'
import webpack from '../webpack'

export const command = 'dev'
export const desc = commands.dev
export const builder = yargs =>
  yargs
    .help('help')
    .epilogue(`${env.title}:\r\n  ${env.text}`)
    .option('test', cli.test)
    .option('port', cli.port)
    .option('inspect', cli.inspect)
    .option('root-path', cli.rootPath)
    .option('static-path', cli.staticPath)
    .option('open-browser', cli.openBrowser)
    .option('config', cli.config)
    .option('build-config', cli.buildConfig)
    .option('print-config', cli.printConfig)
    .conflicts('dev', 'prod')
    .strict()

export const handler = argv =>
  webpack(
    mergeArguments(argv, {
      start: true,
      watch: true,
      build: true,
      openBrowser: true
    })
  )
