import merge from './merge'
import generateCustomMode from './generate_custom_mode'

const validOptions = [
  'dropEventStore',
  'dropSnapshots',
  'dropReadModels',
  'dropSagas'
]

const getConfig = async (resolveConfig, options) => {
  if (options == null || options.constructor !== Object) {
    throw new Error('Invalid reset options')
  }
  for (const key of Object.keys(options)) {
    if (
      !validOptions.includes(key) ||
      options[key] == null ||
      options[key].constructor !== Boolean
    ) {
      throw new Error(`Invalid reset options: ${key}`)
    }
  }

  const config = merge(resolveConfig, {
    apiHandlers: [
      {
        method: 'GET',
        path: 'reset-domain',
        controller: {
          module: 'resolve-runtime/lib/local/reset-domain-handler.js',
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

const reset = generateCustomMode(getConfig, 'reset-domain')

export default reset
