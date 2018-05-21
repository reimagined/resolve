import { env, cli, commands } from '../constants'
import webpack from '../webpack'

export const command = 'build'
export const desc = commands.build
export const builder = yargs =>
  yargs
    .help('help')
    .epilogue(`${env.title}:\n` + `  ${env.text}`)
    .option('dev', cli.dev)
    .option('prod', cli.prod)
    .option('test', cli.test)
    .option('watch', cli.watch)
    .option('start', cli.start)
    .option('host', cli.host)
    .option('port', cli.port)
    .option('protocol', cli.protocol)
    .option('inspect', cli.inspect)
    .option('config', cli.config)
    .option('build-config', cli.buildConfig)
    .option('print-config', cli.printConfig)
    .option('root-path', cli.rootPath)
    .option('open-browser', cli.openBrowser)
    .implies('host', 'start')
    .implies('port', 'start')
    .implies('inspect', 'start')

export const handler = argv =>
  webpack(argv, {
    NODE_ENV: 'production',
    BUILD: 'true'
  })
