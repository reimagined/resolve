import Ajv from 'ajv'
import validatePath from 'resolve-runtime/lib/utils/validate_path'

import { schemaResolveConfig, message } from './constants'
import { checkRuntimeEnv } from './declare_runtime_env'

const ajv = new Ajv()

const allowedMethods = [
  'HEAD',
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'OPTIONS',
  'ALL'
]

export const validateApiHandlers = resolveConfig => {
  if (!resolveConfig.hasOwnProperty('apiHandlers')) {
    return
  }

  for (const [idx, apiHandler] of resolveConfig.apiHandlers.entries()) {
    if (checkRuntimeEnv(apiHandler.path)) {
      throw new Error(`${message.clientEnvError}.apiHandlers[${idx}].path`)
    }
    if (checkRuntimeEnv(apiHandler.method)) {
      throw new Error(`${message.clientEnvError}.apiHandlers[${idx}].method`)
    }

    if (checkRuntimeEnv(apiHandler.controller)) {
      throw new Error(
        `${message.clientEnvError}.apiHandlers[${idx}].controller`
      )
    }

    if (!validatePath(apiHandler.path)) {
      throw new Error(
        `Incorrect options.apiHandlers[${idx}].path = "${
          apiHandler.path
        }"\nValue must be part of the URL, which is HTTP API handler URL path`
      )
    }

    apiHandler.path = encodeURI(apiHandler.path)

    apiHandler.method = apiHandler.method.toUpperCase()

    if (allowedMethods.indexOf(apiHandler.method) < 0) {
      throw new Error(
        `Incorrect options.apiHandlers[${idx}].method = "${
          apiHandler.path
        }"\nAPI handler method should be one from following list ${allowedMethods}`
      )
    }
  }
}

const validateConfig = config => {
  const linearizedConfig = JSON.parse(JSON.stringify(config))
  const valid = ajv.validate(schemaResolveConfig, linearizedConfig)

  if (!valid) {
    throw new Error(
      'Resolve Config validation failed: ' + JSON.stringify(ajv.errors, null, 2)
    )
  }

  validateApiHandlers(config)

  return true
}

export default validateConfig
