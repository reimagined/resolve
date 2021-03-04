import merge from './merge'
import generateCustomMode from './generate_custom_mode'

const validOptions = [
  'dropEventStore',
  'dropReadModels',
  'dropEventBus',
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
  process.env.SKIP_COMMANDS = 'true'

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
    ],
  })

  return config
}

const reset = generateCustomMode(getConfig, 'reset-domain')

export default reset