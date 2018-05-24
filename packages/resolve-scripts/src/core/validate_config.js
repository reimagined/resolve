import Ajv from 'ajv'

import { schemaResolveConfig } from './constants'
import isResolveConfigEnv from './is_resolve_config_env'

const ajv = new Ajv()

ajv.addKeyword('constraints', {
  validate(...args) {
    const [schema, value, , rawKey, , , config] = args

    const key = rawKey.substr(1)

    if (!config.hasOwnProperty('meta')) {
      Object.defineProperty(config, 'meta', {
        value: {
          env: [],
          directory: [],
          file: [],
          fileOrModule: [],
          url: [],
          serverOnly: [],
          external: []
        }
      })
    }

    for (const schemaKey of Object.keys(schema)) {
      if (Array.isArray(config.meta[schemaKey])) {
        config.meta[schemaKey].push(key)
      }
    }

    if (isResolveConfigEnv(value)) {
      return schema.env
    }

    return true
  },
  metaSchema: {
    type: 'object',
    properties: {
      env: {
        type: 'boolean'
      },
      file: {
        type: 'boolean'
      },
      fileOrModule: {
        type: 'boolean'
      },
      serverOnly: {
        type: 'boolean'
      },
      directory: {
        type: 'boolean'
      },
      url: {
        type: 'boolean'
      },
      external: {
        type: 'boolean'
      }
    },
    additionalProperties: false
  },
  errors: true
})

const validateConfig = config => {
  const valid = ajv.validate(schemaResolveConfig, config)

  if (!valid) {
    // eslint-disable-next-line
    console.error('Resolve Config validation failed:')
    // eslint-disable-next-line
    console.error(ajv.errors)

    process.exit(1)
  }
}

export default validateConfig
