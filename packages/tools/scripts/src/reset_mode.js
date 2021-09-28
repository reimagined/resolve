import merge from './merge'
import generateCustomMode from './generate_custom_mode'

const validOptions = [
  'dropEventStore',
  'dropReadModels',
  'dropEventSubscriber',
  'dropSagas',
  'bootstrap',
]

export const getResetDomainConfig = async (resolveConfig, options) => {
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
          module: {
            package: '@resolve-js/runtime-single-process',
            import: 'resetDomainHandler',
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

  return config
}

const reset = generateCustomMode(getResetDomainConfig, 'reset-domain')

export default reset
