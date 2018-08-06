import Ajv from 'ajv'
import Url from 'url'

import { schemaResolveConfig } from './constants'

const ajv = new Ajv()

export const validateRootPath = resolveConfig => {
  if (!resolveConfig.hasOwnProperty('rootPath')) {
    return
  }

  const {
    protocol,
    slashes,
    auth,
    host,
    port,
    hostname,
    hash,
    search,
    query,
    path
  } = Url.parse(resolveConfig.rootPath)

  if (
    protocol ||
    slashes ||
    auth ||
    host ||
    port ||
    hostname ||
    hash ||
    search ||
    query ||
    /^\//.test(path) ||
    /\/$/.test(path)
  ) {
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

  const {
    protocol,
    slashes,
    auth,
    host,
    port,
    hostname,
    hash,
    search,
    query,
    path
  } = Url.parse(resolveConfig.staticPath)

  if (
    protocol ||
    slashes ||
    auth ||
    host ||
    port ||
    hostname ||
    hash ||
    search ||
    query ||
    /^\//.test(path) ||
    /\/$/.test(path) ||
    path === ''
  ) {
    throw new Error(
      `Incorrect options.staticPath = "${
        resolveConfig.staticPath
      }"\nValue must be part of the URL, which is the application's static subdirectory`
    )
  }

  resolveConfig.staticPath = encodeURI(resolveConfig.staticPath)
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

  return true
}

export default validateConfig
