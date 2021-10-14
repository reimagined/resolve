import merge from './merge'
import generateCustomMode from './generate_custom_mode'

const getConfig = async (resolveConfig, options) => {
  if (options == null || options.constructor !== Object) {
    throw new Error('Invalid import-event-store options')
  }
  const { directory } = options
  if (directory == null || directory.constructor !== String) {
    throw new Error('Options field "directory" must be string')
  }

  const config = merge(resolveConfig, {
    apiHandlers: [
      {
        method: 'GET',
        path: '/api/import-event-store',
        handler: {
          module: {
            package: '@resolve-js/runtime-single-process',
            import: 'importEventStoreHandler',
          },
          options,
        },
      },
      {
        method: 'OPTIONS',
        path: '/SKIP_COMMANDS',
        handler: {
          package: '@resolve-js/runtime-base',
          import: 'failHandler',
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

const importEventStoreMode = generateCustomMode(getConfig, 'import-event-store')

export default importEventStoreMode
