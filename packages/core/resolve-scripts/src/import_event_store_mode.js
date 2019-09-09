import merge from './merge'
import generateCustomMode from './generate_custom_mode'
import fs from 'fs'

const getConfig = async (resolveConfig, options) => {
  if (options == null || options.constructor !== Object) {
    throw new Error('Invalid import-event-store options')
  }
  const { importFile } = options
  if (importFile == null || importFile.constructor !== String) {
    throw new Error('Options field "importFile" must be string')
  }
  if (!fs.existsSync(importFile)) {
    throw new Error(`File ${importFile} does not exist`)
  }

  const config = merge(resolveConfig, {
    apiHandlers: [
      {
        method: 'GET',
        path: 'import-event-store',
        controller: {
          module: 'resolve-runtime/lib/local/import-event-store-handler.js',
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

const importEventStoreMode = generateCustomMode(getConfig, 'import-event-store')

export default importEventStoreMode
