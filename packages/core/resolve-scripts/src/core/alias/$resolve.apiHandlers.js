import { message } from '../constants'
import resolveFile from '../resolve_file'
import { checkRuntimeEnv } from '../declare_runtime_env'

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
  const exports = [``, `const apiHandlers = []`, ``]

  for (let index = 0; index < resolveConfig.apiHandlers.length; index++) {
    const apiHandler = resolveConfig.apiHandlers[index]

    if (checkRuntimeEnv(apiHandler.path)) {
      throw new Error(`${message.clientEnvError}.apiHandlers[${index}].path`)
    }
    const path = apiHandler.path

    if (checkRuntimeEnv(apiHandler.controller)) {
      throw new Error(
        `${message.clientEnvError}.apiHandlers[${index}].controller`
      )
    }
    const controller = resolveFile(apiHandler.controller)

    constants.push(`const path_${index} = ${JSON.stringify(path)}`)

    imports.push(
      `import controller_${index} from ${JSON.stringify(controller)}`,
      ``
    )

    exports.push(`apiHandlers.push({`, `  path: path_${index}`)
    exports.push(`, controller: controller_${index}`)
    exports.push(`})`, ``)
  }

  exports.push(`export default apiHandlers`)

  return {
    code: [...imports, ...constants, ...exports].join('\r\n')
  }
}
