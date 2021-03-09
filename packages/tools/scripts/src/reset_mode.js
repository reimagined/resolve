import merge from './merge'
import generateCustomMode from './generate_custom_mode'

const validOptions = [
  'dropEventStore',
  'dropReadModels',
  'dropEventSubscriber',
  'dropSagas',
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
        path: '/api/reset-domain',
        handler: {
          module: '@resolve-js/runtime/lib/local/reset-domain-handler.js',
          options,
        },
      },
      {
        method: 'OPTIONS',
        path: '/SKIP_COMMANDS',
        handler: '@resolve-js/runtime/lib/common/handlers/fail-handler.js',
      },
    ],
  })

  return config
}

const reset = generateCustomMode(getConfig, 'reset-domain')

export default reset
