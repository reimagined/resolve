import table from '../utils/table'
import webpack from '../webpack'
import {
  commands,
  cli,
  env,
  envTitle,
  defaultsTitle,
  defaults,
  customEnvText,
  customEnvTitle
} from '../configs/strings'

export const command = 'dev'
export const desc = commands.dev
export const builder = yargs =>
  yargs
    .help('help')
    .epilogue(
      `${envTitle}:\n` +
        `${table([
          env.NODE_ENV,
          env.CONFIG_PATH,
          env.ROUTES_PATH,
          env.INDEX_PATH,
          env.ROOT_PATH,
          env.DIST_DIR,
          env.STATIC_DIR,
          env.STATIC_PATH,
          env.AGGREGATES_PATH,
          env.VIEW_MODELS_PATH,
          env.READ_MODELS_PATH,
          env.HOST,
          env.PORT,
          env.INSPECT_HOST,
          env.INSPECT_PORT,
          env.OPEN_BROWSER
        ])}\n` +
        `${customEnvTitle}:\n` +
        `  ${customEnvText}\n\n` +
        `${defaultsTitle}:\n` +
        `${defaults}`
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
