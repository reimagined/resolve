import getClientGlobalEnvObject from '../client_global_object'
import { checkRuntimeEnv } from '../declare_runtime_env'
import { message } from '../constants'

const importClientChunk = ({ resolveConfig, isClient }) => {
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
      try {
        if(window == null || clientGlobalObject !== window) {
          throw new Error('Skip warning')
        }
        console.warn(\`
          Client-runtime variables have been set to default values since __RESOLVE_RUNTIME_ENV__ is not defined
        \`)
      } catch(e) {}
    }
  `)

  exports.push(
    `const clientChunk = {`,
    `  clientImports: interopRequireDefault(require('$resolve.clientImports')).default,`,
    `  viewModels: interopRequireDefault(require('$resolve.viewModels')).default,`,
    `  rootPath: interopRequireDefault(require('$resolve.rootPath')).default,`,
    `  staticPath: interopRequireDefault(require('$resolve.staticPath')).default,`,
    `  jwtCookie: interopRequireDefault(require('$resolve.jwtCookie')).default,`,
    `  applicationName: interopRequireDefault(require('$resolve.applicationName')).default,`,
    `  subscriber: interopRequireDefault(require('@resolve-js/client/lib/subscribe-adapter')).default,`,
    `  customConstants: interopRequireDefault(require('$resolve.customConstants')).default,`,
    `  cdnUrl: interopRequireDefault(require('$resolve.cdnUrl')).default`,
    `}`
  )

  exports.push(`export default clientChunk`)

  return exports.join('\r\n')
}

export default importClientChunk
