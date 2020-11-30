import merge from './merge'
import generateCustomMode from './generate_custom_mode'

const getConfig = async (resolveConfig, options) => {
  if (options == null || options.constructor !== Object) {
    throw new Error('Invalid export-event-store options')
  }
  const { exportFile } = options
  if (exportFile == null || exportFile.constructor !== String) {
    throw new Error('Options field "exportFile" must be string')
  }

  const config = merge(resolveConfig, {
    apiHandlers: [
      {
        method: 'GET',
        path: '/api/export-event-store',
        handler: {
          module: 'resolve-runtime/lib/local/export-event-store-handler.js',
          options,
        },
      },
    ],
    eventBroker: {
      upstream: false,
    },
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
