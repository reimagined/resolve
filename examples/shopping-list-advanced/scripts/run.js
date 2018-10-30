const {
  defaultResolveConfig,
  build,
  start,
  watch,
  runTestcafe
} = require('resolve-scripts')

const devConfig = require('./config.dev')
const prodConfig = require('./config.prod')
const testFunctionalConfig = require('./config.test-functional')
const adjustWebpackConfigs = require('./config.adjust-webpack')
const appConfig = require('./config.app')

const launchMode = process.argv[2]

void (async () => {
  switch (launchMode) {
    case 'dev': {
      const resolveConfig = {
        ...defaultResolveConfig,
        ...appConfig,
        ...devConfig
      }
      await watch(
        resolveConfig,
        adjustWebpackConfigs.bind(null, resolveConfig, { watch: true })
      )
      break
    }

    case 'build': {
      const resolveConfig = {
        ...defaultResolveConfig,
        ...appConfig,
        ...prodConfig
      }
      await build(
        resolveConfig,
        adjustWebpackConfigs.bind(null, resolveConfig, {})
      )
      break
    }

    case 'start': {
      await start({
        ...defaultResolveConfig,
        ...appConfig,
        ...prodConfig
      })
      break
    }

    case 'test:functional': {
      await runTestcafe({
        resolveConfig: testFunctionalConfig,
        functionalTestsDir: 'test/functional',
        browser: process.argv[3]
      })
      break
    }

    default: {
      throw new Error('Unknown option')
    }
  }
})().catch(error => {
  // eslint-disable-next-line no-console
  console.log(error)
  process.exit(1)
})
