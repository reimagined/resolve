import Url from 'url'
import { isV4Format } from 'ip'

import resolveFile from './resolve_file'

export const extenders = []

extenders.push(rootPath)
export function rootPath(resolveConfig) {
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

extenders.push(staticPath)
export function staticPath(resolveConfig) {
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

extenders.push(useYarn)
export function useYarn(resolveConfig) {
  const env = process.env
  resolveConfig.useYarn =
    (env.npm_config_user_agent && env.npm_config_user_agent.includes('yarn')) ||
    (env.npm_execpath && env.npm_execpath.includes('yarn'))
}

extenders.push(applicationName)
export function applicationName(resolveConfig) {
  const { name } = require(resolveFile('package.json'))
  resolveConfig.applicationName = name
}

extenders.push(mode)
export function mode(resolveConfig, options) {
  if (!resolveConfig.hasOwnProperty('mode')) {
    resolveConfig.mode = options.mode
  }
}

extenders.push(openBrowser)
export function openBrowser(resolveConfig, options) {
  if (!resolveConfig.hasOwnProperty('openBrowser')) {
    resolveConfig.openBrowser = options.openBrowser
  }
}

extenders.push(customWebpackConfig)
export function customWebpackConfig(resolveConfig) {
  const callback = resolveConfig.webpack

  if (typeof callback !== 'function' || callback.length !== 2) {
    throw new Error(
      `Incorrect options.webpack = "${
        resolveConfig.webpack
      }"\nShould be function with following signature: (webpackConfigs, resolveConfig) => {}`
    )
  }
}

export default function assignSettings(resolveConfig, options) {
  for (const extender of extenders) {
    extender(resolveConfig, options)
  }
}
