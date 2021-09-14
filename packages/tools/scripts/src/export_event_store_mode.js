import merge from './merge'
import generateCustomMode from './generate_custom_mode'

const getConfig = async (resolveConfig, options) => {
  if (options == null || options.constructor !== Object) {
    throw new Error('Invalid export-event-store options')
  }
  const { directory } = options
  if (directory == null || directory.constructor !== String) {
    throw new Error('Options field "directory" must be a string')
  }

  const config = merge(resolveConfig, {
    apiHandlers: [
      {
        method: 'GET',
        path: '/api/export-event-store',
        handler: {
          module: {
            package: '@resolve-js/runtime',
            import: 'exportEventStoreHandler',
          },
          options,
        },
      },
      {
        method: 'OPTIONS',
        path: '/SKIP_COMMANDS',
        handler: {
          package: '@resolve-js/runtime',
          entry: 'fail-handler',
        },
      },
    ],
  })
  Object.assign(config, {
    readModelConnectors: {},
    readModels: [],
    viewModels: [],
    sagas: [],
  })

  return config
}

const exportEventStoreMode = generateCustomMode(getConfig, 'export-event-store')

export default exportEventStoreMode
