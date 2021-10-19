import getClientGlobalEnvObject from '../client_global_object'
import { checkRuntimeEnv } from '../declare_runtime_env'

const importReactNativeChunk = ({ resolveConfig }) => {
  const exports = []

  exports.push(
    `import interopRequireDefault from "@babel/runtime/helpers/interopRequireDefault"`,
    `const clientGlobalObject = ${getClientGlobalEnvObject()}`,
    `clientGlobalObject.__RESOLVE_RUNTIME_ENV__ = { }`
  )

  exports.push(`import { createActions } from '@resolve-js/redux'`)

  const clientEnvs = []
  void JSON.stringify(resolveConfig, (key, value) => {
    if (checkRuntimeEnv(value)) {
      clientEnvs.push(value)
    }
    return value
  })

  for (const clientEnv of clientEnvs) {
    if (process.env[String(clientEnv)] != null) {
      exports.push(`Object.defineProperty(
        clientGlobalObject.__RESOLVE_RUNTIME_ENV__,
        ${JSON.stringify(String(clientEnv))},
        {
          enumerable: true,
          value: ${JSON.stringify(process.env[String(clientEnv)])}
        }
      )`)
    } else {
      exports.push(`Object.defineProperty(
        clientGlobalObject.__RESOLVE_RUNTIME_ENV__,
        ${JSON.stringify(String(clientEnv))},
        {
          enumerable: true,
          value: ${JSON.stringify(String(clientEnv.defaultValue))}
        }
      )`)
    }
  }

  exports.push(
    `export const viewModels = interopRequireDefault(require('$resolve.viewModels')).default`,
    `export const rootPath = interopRequireDefault(require('$resolve.rootPath')).default`,
    `export const staticPath = interopRequireDefault(require('$resolve.staticPath')).default`,
    `export const jwtCookie = interopRequireDefault(require('$resolve.jwtCookie')).default`,
    `export const applicationName = interopRequireDefault(require('$resolve.applicationName')).default`,
    `export const subscriber = interopRequireDefault(require('@resolve-js/client/lib/subscribe-adapter')).default`,
    `export const customConstants = interopRequireDefault(require('$resolve.customConstants')).default`
  )

  return exports.join('\r\n')
}

export default importReactNativeChunk
