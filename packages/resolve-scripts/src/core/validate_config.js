import Ajv from 'ajv'
import { envKey } from 'json-env-extract'

import { schemaResolveConfig } from './constants'

const ajv = new Ajv()

ajv.addKeyword('constraints', {
  validate(...args) {
    const [schema, value, , rawKey, , , resolveConfig] = args

    const key = rawKey.substr(1)

    if (!resolveConfig.hasOwnProperty('meta')) {
      Object.defineProperty(resolveConfig, 'meta', {
        value: {
          env: [],
          directory: [],
          file: [],
          fileOrModule: [],
          url: []
        }
      })
    }

    for (const schemaKey of Object.keys(schema)) {
      if (Array.isArray(resolveConfig.meta[schemaKey])) {
        resolveConfig.meta[schemaKey].push(key)
      }
    }

    if (resolveConfig[envKey][value]) {
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
      directory: {
        type: 'boolean'
      },
      url: {
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
