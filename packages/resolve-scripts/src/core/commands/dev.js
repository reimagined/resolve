import { env, cli, commands } from '../constants'
import webpack from '../webpack'

export const command = 'dev'
export const desc = commands.dev
export const builder = yargs =>
  yargs
    .help('help')
    .epilogue(`${env.title}:\r\n` + `  ${env.text}`)
    .option('test', cli.test)
    .option('host', cli.host)
    .option('port', cli.port)
    .option('protocol', cli.protocol)
    .option('inspect', cli.inspect)
    .option('root-path', cli.rootPath)
    .option('open-browser', cli.openBrowser)
    .option('config', cli.config)
    .option('build-config', cli.buildConfig)
    .option('print-config', cli.printConfig)

export const handler = argv =>
  webpack(argv, {
    START: 'true',
    WATCH: 'true',
    BUILD: 'true',
    OPEN_BROWSER: 'true'
  })
