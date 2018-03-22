import config from './resolve.config'

export const commands = {
  build: 'Builds the app to the build directory',
  dev: 'Runs the app in the development mode',
  start: 'Runs the app from the build directory',
  lint: 'Check the source code for syntax errors and potential issues',
  testFunctional: 'Runs functional tests with TestCafe',
  testUnit: 'Runs unit tests with Jest',
  update:
    'Updates all resolve packages to the latest version according to semver'
}

export const cli = {
  dev: {
    default: undefined,
    describe: "Sets webpack.mode and process.env.NODE_ENV to 'development'",
    type: 'boolean'
  },
  prod: {
    default: undefined,
    describe: "Sets webpack.mode and process.env.NODE_ENV to 'production'",
    type: 'boolean'
  },
  test: {
    default: undefined,
    describe:
      "Sets webpack.mode to 'development' and process.env.NODE_ENV to 'test'",
    type: 'boolean'
  },
  watch: {
    default: undefined,
    describe: 'Watch the filesystem for changes',
    type: 'boolean'
  },
  start: {
    default: undefined,
    describe: "Automatically start your server once Webpack's build completes",
    type: 'boolean'
  },
  inspect: {
    default: undefined,
    describe: 'Activate inspector on [host:]port',
    type: 'string'
  },
  host: {
    default: undefined,
    describe: `Application's hostname`,
    type: 'string'
  },
  port: {
    default: undefined,
    describe: `Sets the application's port`,
    type: 'number'
  },
  protocol: {
    default: undefined,
    describe: `Sets the application's protocol`,
    type: 'string'
  },
  openBrowser: {
    default: undefined,
    describe: `Open browser with the root page`,
    type: 'boolean'
  },
  browser: {
    default: undefined,
    describe: `Specified browser for TestCafe`,
    type: 'string'
  },
  config: {
    default: undefined,
    describe: 'Path to resolve config',
    type: 'string'
  },
  rootPath: {
    default: undefined,
    describe: `Application's root path`,
    type: 'string'
  },
  printConfig: {
    default: undefined,
    describe: 'Print the full configuration',
    type: 'boolean'
  }
}

export const defaultsTitle = 'Default config'

export const defaults = JSON.stringify(config, null, 3)

export const envTitle = 'Environment variables'

export const env = {
  NODE_ENV: ['NODE_ENV', 'Production/development mode'],
  WATCH: ['WATCH', 'Watch the filesystem for changes'],
  START: [
    'START',
    `Automatically start your server once Webpack's build completes`
  ],
  ROOT_PATH: ['ROOT_PATH', "Application's root path"],
  ROUTES_PATH: ['ROUTES_PATH', 'Path to the static route configuration)'],
  INDEX_PATH: ['INDEX_PATH', 'Path to the application entry file'],
  HOST: ['HOST', `Application's hostname`],
  PORT: ['PORT', `Application's  port`],
  PROTOCOL: ['PROTOCOL', `Application's protocol`],
  CONFIG_PATH: ['CONFIG_PATH', 'Path to the resolve config'],
  DIST_DIR: ['DIST_DIR', 'Path to the dist directory'],
  STATIC_DIR: ['STATIC_DIR', 'Path to the static directory'],
  STATIC_PATH: ['STATIC_PATH', 'The static root path'],
  AGGREGATES_PATH: ['AGGREGATES_PATH', 'Path to the aggregates'],
  VIEW_MODELS_PATH: ['VIEW_MODELS_PATH', 'Path to the view models'],
  READ_MODELS_PATH: ['READ_MODELS_PATH', 'Path to the read models'],
  INSPECT_HOST: ['INSPECT_HOST', 'Inspector host'],
  INSPECT_PORT: ['INSPECT_PORT', 'Inspector port'],
  REGISTRY: ['REGISTRY', 'Resolve registry URL'],
  TOKEN: ['TOKEN', 'Resolve registry authorization token'],
  OPEN_BROWSER: ['OPEN_BROWSER', 'Open browser with the root page']
}

export const customEnvTitle = 'Custom Environment Variables'
export const customEnvText =
  'You can pass custom env variables to the client side. ' +
  'To do this, use the RESOLVE_ prefix when naming a variable. ' +
  'After that, this variable is available on the client and ' +
  'server side via the process.env object'
