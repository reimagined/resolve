import webpack from '../webpack'
import table from '../table'

const env = require('../../../configs/env.list.json')
const commands = require('../../../configs/command.list.json')
const cli = require('../../../configs/cli.list.json')

export const command = 'build'
export const desc = commands.build
export const builder = yargs =>
  yargs
    .help('help')
    .epilogue(
      `${env.title}:\n` +
        `${table([
          env.options.NODE_ENV,
          env.options.WATCH,
          env.options.START,
          env.options.HOST,
          env.options.PORT,
          env.options.PROTOCOL,
          env.options.INSPECT_HOST,
          env.options.INSPECT_PORT,
          env.options.CONFIG_PATH,
          env.options.ROUTES_PATH,
          env.options.INDEX_PATH,
          env.options.ROOT_PATH,
          env.options.DIST_DIR,
          env.options.STATIC_DIR,
          env.options.STATIC_PATH,
          env.options.AGGREGATES_PATH,
          env.options.VIEW_MODELS_PATH,
          env.options.READ_MODELS_PATH,
          env.options.OPEN_BROWSER
        ])}\n` +
        `${env.custom.title}:\n` +
        `  ${env.custom.text}`
    )
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
