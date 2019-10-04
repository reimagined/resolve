import getClientGlobalEnvObject from '../client_global_object'
import { checkRuntimeEnv } from '../declare_runtime_env'
import { message } from '../constants'

export default ({ resolveConfig, isClient }) => {
  if (!isClient) {
    throw new Error(`${message.clientAliasInServerCodeError}.clientAssemblies`)
  }
  const exports = []

  exports.push(
    `import interopRequireDefault from "@babel/runtime/helpers/interopRequireDefault"`,
    `const clientGlobalObject = ${getClientGlobalEnvObject()}`,
    `const defaultRuntimeEnv = {}`
  )

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
        defaultRuntimeEnv,
        ${JSON.stringify(String(clientEnv))},
        {
          enumerable: true,
          value: ${JSON.stringify(process.env[String(clientEnv)])}
        }
      )`)
    } else {
      exports.push(`Object.defineProperty(
        defaultRuntimeEnv,
        ${JSON.stringify(String(clientEnv))},
        {
          enumerable: true,
          value: ${JSON.stringify(String(clientEnv.defaultValue))}
        }
      )`)
    }
  }

  exports.push(`
    if(clientGlobalObject.__RESOLVE_RUNTIME_ENV__ == null) {
      clientGlobalObject.__RESOLVE_RUNTIME_ENV__ = defaultRuntimeEnv
      console.warn(\`
        Client-runtime variables have been set to default values since __RESOLVE_RUNTIME_ENV__ is not defined
      \`)
    }
  `)

  exports.push(
    `export const clientImports = interopRequireDefault(require('$resolve.clientImports')).default`,
    `export const viewModels = interopRequireDefault(require('$resolve.viewModels')).default`,
    `export const rootPath = interopRequireDefault(require('$resolve.rootPath')).default`,
    `export const staticPath = interopRequireDefault(require('$resolve.staticPath')).default`,
    `export const jwtCookie = interopRequireDefault(require('$resolve.jwtCookie')).default`,
    `export const applicationName = interopRequireDefault(require('$resolve.applicationName')).default`,
    `export const subscribeAdapter = interopRequireDefault(require('$resolve.subscribeAdapter')).default`,
    `export const customConstants = interopRequireDefault(require('$resolve.customConstants')).default`
  )

  return {
    code: exports.join('\r\n')
  }
}
