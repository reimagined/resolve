import webpack from '../webpack'
import table from '../table'

const env = require('../../../configs/env.list.json')
const commands = require('../../../configs/command.list.json')
const cli = require('../../../configs/cli.list.json')
Object.keys(cli).forEach(key => (cli[key].default = undefined))

export const command = 'dev'
export const desc = commands.dev
export const builder = yargs =>
  yargs
    .help('help')
    .epilogue(
      `${env.title}:\r\n` +
        `${table([
          env.options.NODE_ENV,
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
        ])}\r\n` +
        `${env.custom.title}:\r\n` +
        `  ${env.custom.text}`
    )
    .option('test', cli.test)
    .option('host', cli.host)
    .option('port', cli.port)
    .option('protocol', cli.protocol)
    .option('inspect', cli.inspect)
    .option('root-path', cli.rootPath)
    .option('open-browser', cli.openBrowser)
    .option('config', cli.config)
    .option('print-config', cli.printConfig)

export const handler = argv =>
  webpack(argv, {
    START: 'true',
    WATCH: 'true',
    BUILD: 'true',
    OPEN_BROWSER: 'true'
  })
