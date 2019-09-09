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
        path: 'export-event-store',
        controller: {
          module: 'resolve-runtime/lib/local/export-event-store-handler.js',
          options
        }
      }
    ],
    eventBroker: {
      upstream: false
    }
  })

  return config
}

const exportEventStoreMode = generateCustomMode(getConfig, 'export-event-store')

export default exportEventStoreMode
