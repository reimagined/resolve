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

export const command = 'build'
export const desc = commands.build
export const builder = yargs =>
  yargs
    .help('help')
    .epilogue(
      `${envTitle}:\n` +
        `${table([
          env.NODE_ENV,
          env.WATCH,
          env.START,
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
          env.INSPECT_PORT
        ])}\n` +
        `${customEnvTitle}:\n` +
        `  ${customEnvText}\n\n` +
        `${defaultsTitle}:\n` +
        `${defaults}`
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
    .implies('host', 'start')
    .implies('port', 'start')
    .implies('inspect', 'start')
    .conflicts('dev', 'prod')

export const handler = argv =>
  webpack({
    prod: true,
    ...argv,
    build: true
  })
