import {
  message,
  RESOURCE_ANY,
  RUNTIME_ENV_ANYWHERE,
  IMPORT_INSTANCE
} from '../constants'
import { checkRuntimeEnv } from '../declare_runtime_env'
import importResource from '../import_resource'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.apiHandlers`
    )
  }

  if (!resolveConfig.apiHandlers) {
    throw new Error(`${message.configNotContainSectionError}.apiHandlers`)
  }

  if (checkRuntimeEnv(resolveConfig.apiHandlers)) {
    throw new Error(`${message.clientEnvError}.apiHandlers`)
  }

  const imports = [``]
  const constants = [``]
  const exports = [``, `let apiHandlers = []`, ``]

  for (let index = 0; index < resolveConfig.apiHandlers.length; index++) {
    const apiHandler = resolveConfig.apiHandlers[index]

    if (checkRuntimeEnv(apiHandler.path)) {
      throw new Error(`${message.clientEnvError}.apiHandlers[${index}].path`)
    }
    constants.push(`const path_${index} = ${JSON.stringify(apiHandler.path)}`)

    if (checkRuntimeEnv(apiHandler.method)) {
      throw new Error(`${message.clientEnvError}.apiHandlers[${index}].method`)
    }
    constants.push(
      `const method_${index} = ${JSON.stringify(apiHandler.method)}`
    )

    importResource({
      resourceName: `controller_${index}`,
      resourceValue: apiHandler.controller,
      runtimeMode: RUNTIME_ENV_ANYWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      imports,
      constants
    })

    exports.push(`apiHandlers.push({`, `  path: path_${index}`)
    exports.push(`, controller: controller_${index}`)
    exports.push(`, method: method_${index}`)
    exports.push(`})`, ``)
  }

  // https://webpack.js.org/api/module-variables/#__resourcequery-webpack-specific-
  exports.push(`try {
    let handlerIdx = null
    if(__resourceQuery.constructor === String && __resourceQuery[0] === '?') {
      handlerIdx = Number(__resourceQuery.substring(1))
    }
    if(Number.isInteger(handlerIdx) && handlerIdx > -1 && handlerIdx < apiHandlers.length) {
      apiHandlers = apiHandlers[handlerIdx]
    }
  } catch(err) {}`)

  exports.push(`export default apiHandlers`)

  return {
    code: [...imports, ...constants, ...exports].join('\r\n')
  }
}
