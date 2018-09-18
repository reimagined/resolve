import Ajv from 'ajv'

import { schemaResolveConfig, message } from './constants'
import { checkRuntimeEnv } from './declare_runtime_env'
import resolveFile from './resolve_file'
import validatePath from './validate_path'

const ajv = new Ajv()

export const validateRootPath = resolveConfig => {
  if (!resolveConfig.hasOwnProperty('rootPath')) {
    return
  }

  if (!validatePath(resolveConfig.rootPath, true)) {
    throw new Error(
      `Incorrect options.rootPath = "${
        resolveConfig.rootPath
      }"\nValue must be part of the URL, which is the application's subdirectory`
    )
  }

  resolveConfig.rootPath = encodeURI(resolveConfig.rootPath)
}

export const validateStaticPath = resolveConfig => {
  if (!resolveConfig.hasOwnProperty('staticPath')) {
    return
  }

  if (!validatePath(resolveConfig.staticPath)) {
    throw new Error(
      `Incorrect options.staticPath = "${
        resolveConfig.staticPath
      }"\nValue must be part of the URL, which is the application's static subdirectory`
    )
  }

  resolveConfig.staticPath = encodeURI(resolveConfig.staticPath)
}

export const validateApiHandlers = resolveConfig => {
  if (!resolveConfig.hasOwnProperty('apiHandlers')) {
    return
  }

  for (const [idx, apiHandler] of resolveConfig.apiHandlers.entries()) {
    if (checkRuntimeEnv(apiHandler.path)) {
      throw new Error(`${message.clientEnvError}.apiHandlers[${idx}].path`)
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

    resolveFile(apiHandler.controller)
  }
}

const validateConfig = config => {
  const valid = ajv.validate(schemaResolveConfig, config)

  if (!valid) {
    throw new Error(
      'Resolve Config validation failed: ' + JSON.stringify(ajv.errors, null, 2)
    )
  }

  validateStaticPath(config)
  validateRootPath(config)
  validateApiHandlers(config)

  return true
}

export default validateConfig
