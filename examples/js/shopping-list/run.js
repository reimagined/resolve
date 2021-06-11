import {
  defaultResolveConfig,
  build,
  start,
  watch,
  runTestcafe,
  merge,
  stop,
  reset,
  importEventStore,
  exportEventStore,
} from '@resolve-js/scripts'
import resolveModuleAdmin from '@resolve-js/module-admin'
import appConfig from './config.app'
import cloudConfig from './config.cloud'
import devConfig from './config.dev'
import prodConfig from './config.prod'
import testFunctionalConfig from './config.test-functional'
import adjustWebpackConfigs from './config.adjust-webpack'
const launchMode = process.argv[2]
void (async () => {
  try {
    switch (launchMode) {
      case 'dev': {
        const moduleAdmin = resolveModuleAdmin()
        const resolveConfig = merge(
          defaultResolveConfig,
          appConfig,
          devConfig,
          moduleAdmin
        )
        await watch(resolveConfig, adjustWebpackConfigs)
        break
      }
      case 'reset': {
        const moduleAdmin = resolveModuleAdmin()
        const resolveConfig = merge(
          defaultResolveConfig,
          appConfig,
          devConfig,
          moduleAdmin
        )
        await reset(
          resolveConfig,
          {
            dropEventStore: false,
            dropEventSubscriber: true,
            dropReadModels: true,
            dropSagas: true,
          },
          adjustWebpackConfigs
        )
        break
      }
      case 'build': {
        await build(
          merge(defaultResolveConfig, appConfig, prodConfig),
          adjustWebpackConfigs
        )
        break
      }
      case 'cloud': {
        await build(
          merge(defaultResolveConfig, appConfig, cloudConfig),
          adjustWebpackConfigs
        )
        break
      }
      case 'start': {
        await start(
          merge(defaultResolveConfig, appConfig, prodConfig),
          adjustWebpackConfigs
        )
        break
      }
      case 'import-event-store': {
        const resolveConfig = merge(defaultResolveConfig, appConfig, devConfig)
        const directory = process.argv[3]
        await importEventStore(
          resolveConfig,
          { directory },
          adjustWebpackConfigs
        )
        break
      }
      case 'export-event-store': {
        const resolveConfig = merge(defaultResolveConfig, appConfig, devConfig)
        const directory = process.argv[3]
        await exportEventStore(
          resolveConfig,
          { directory },
          adjustWebpackConfigs
        )
        break
      }
      case 'test:e2e': {
        const moduleAdmin = resolveModuleAdmin()
        const resolveConfig = merge(
          defaultResolveConfig,
          appConfig,
          testFunctionalConfig,
          moduleAdmin
        )
        await reset(
          resolveConfig,
          {
            dropEventStore: true,
            dropEventSubscriber: true,
            dropReadModels: true,
            dropSagas: true,
          },
          adjustWebpackConfigs
        )
        await runTestcafe({
          resolveConfig,
          adjustWebpackConfigs,
          functionalTestsDir: 'test/e2e',
          browser: process.argv[3],
          customArgs: ['--stop-on-first-fail'],
        })
        break
      }
      default: {
        throw new Error('Unknown option')
      }
    }
    await stop()
  } catch (error) {
    await stop(error)
  }
})()
