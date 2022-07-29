// mdis-start build
// mdis-start start
// mdis-start watch
// mdis-start runTestcafe
// mdis-start merge
// mdis-start stop
// mdis-start reset
// mdis-start importEventStore
// mdis-start exportEventStore
// mdis-start validateConfig
import {
  // mdis-stop validateConfig
  // mdis-stop exportEventStore
  // mdis-stop importEventStore
  // mdis-stop reset
  // mdis-stop stop
  // mdis-stop merge
  // mdis-stop runTestcafe
  // mdis-stop watch
  // mdis-stop start
  build,
  // mdis-stop build
  // mdis-start start
  start,
  // mdis-stop start
  // mdis-start watch
  watch,
  // mdis-stop watch
  // mdis-start runTestcafe
  runTestcafe,
  // mdis-stop runTestcafe
  // mdis-start merge
  merge,
  // mdis-stop merge
  // mdis-start stop
  stop,
  // mdis-stop stop
  // mdis-start reset
  reset,
  // mdis-stop reset
  // mdis-start importEventStore
  importEventStore,
  // mdis-stop importEventStore
  // mdis-start exportEventStore
  exportEventStore,
  // mdis-stop exportEventStore
  // mdis-start validateConfig
  validateConfig,
  // mdis-stop validateConfig
  defaultResolveConfig,
  // mdis-start build
  // mdis-start start
  // mdis-start watch
  // mdis-start runTestcafe
  // mdis-start merge
  // mdis-start stop
  // mdis-start reset
  // mdis-start importEventStore
  // mdis-start exportEventStore
  // mdis-start validateConfig
} from '@resolve-js/scripts'
// mdis-stop validateConfig
// mdis-stop exportEventStore
// mdis-stop importEventStore
// mdis-stop reset
// mdis-stop stop
// mdis-stop merge
// mdis-stop runTestcafe
// mdis-stop watch
// mdis-stop start
// mdis-stop build

const appConfig = {}
const baseConfig = {}
const devConfig = {}
const prodConfig = {}
const testFunctionalConfig = {}

void (async function () {
  const launchMode = process.argv[2]
  // mdis-start stop
  try {
    // mdis-stop stop

    // mdis-start merge
    const resolveConfig = merge(defaultResolveConfig, appConfig, devConfig)
    // mdis-stop merge

    const config = resolveConfig

    // mdis-start validateConfig
    validateConfig(config)
    // mdis-stop validateConfig

    // mdis-start build
    // mdis-start start
    // mdis-start watch
    // mdis-start runTestcafe
    // mdis-start reset
    // mdis-start importEventStore
    // mdis-start exportEventStore
    switch (launchMode) {
      // mdis-stop exportEventStore
      // mdis-stop importEventStore
      // mdis-stop reset
      // mdis-stop runTestcafe
      // mdis-stop watch
      // mdis-stop start
      // mdis-stop build
      // mdis-start build
      case 'build': {
        const resolveConfig = merge(baseConfig, prodConfig)
        await build(resolveConfig)
        break
      }
      // mdis-stop build
      // mdis-start start
      case 'start': {
        await start(merge(baseConfig, prodConfig))
        break
      }
      // mdis-stop start
      // mdis-start watch
      case 'dev': {
        const resolveConfig = merge(baseConfig, devConfig)
        await watch(resolveConfig)
        break
      }
      // mdis-stop watch
      // mdis-start runTestcafe
      case 'test:e2e': {
        const resolveConfig = merge(baseConfig, testFunctionalConfig)
        await runTestcafe({
          resolveConfig,
          functionalTestsDir: 'test/functional',
          browser: process.argv[3],
        })
        break
      }
      // mdis-stop runTestcafe
      // mdis-start reset
      case 'reset': {
        const resolveConfig = merge(baseConfig, devConfig)
        await reset(resolveConfig, {
          dropEventStore: true,
          dropEventSubscriber: true,
          dropReadModels: true,
          dropSagas: true,
        })
        break
      }
      // mdis-stop reset
      // mdis-start importEventStore
      case 'import-event-store': {
        const resolveConfig = merge(baseConfig, devConfig)

        const directory = process.argv[3]
        await importEventStore(resolveConfig, { directory })
        break
      }
      // mdis-stop importEventStore
      // mdis-start exportEventStore
      case 'export-event-store': {
        const resolveConfig = merge(baseConfig, devConfig)

        const directory = process.argv[3]
        await exportEventStore(resolveConfig, { directory })
        break
      }
      // mdis-stop exportEventStore
      default:
      // mdis-start build
      // mdis-start start
      // mdis-start watch
      // mdis-start runTestcafe
      // mdis-start reset
      // mdis-start importEventStore
      // mdis-start exportEventStore
    }
    // mdis-stop validateConfig
    // mdis-stop exportEventStore
    // mdis-stop importEventStore
    // mdis-stop reset
    // mdis-stop stop
    // mdis-stop merge
    // mdis-stop runTestcafe
    // mdis-stop watch
    // mdis-stop start
    // mdis-stop build
  } catch (error) {
    await stop(error)
  }
  // mdis-stop stop
})()
