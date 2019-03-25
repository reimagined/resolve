import {
  message,
  RESOURCE_ANY,
  RUNTIME_ENV_ANYWHERE,
  IMPORT_CONSTRUCTOR
} from '../constants'
import { checkRuntimeEnv } from '../declare_runtime_env'
import importResource from '../import_resource'

export default ({ resolveConfig, isClient }) => {
  if (!resolveConfig.readModelConnectors) {
    throw new Error(
      `${message.configNotContainSectionError}.readModelConnectors`
    )
  }
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}.readModelConnectors`
    )
  }

  const imports = []
  const constants = [``]
  const exports = [`const readModelConnectors = {}`]

  const readModelConnectorsNames = Object.keys(
    resolveConfig.readModelConnectors
  )

  for (let index = 0; index < readModelConnectorsNames.length; index++) {
    const readModelConnector =
      resolveConfig.readModelConnectors[readModelConnectorsNames[index]]

    if (checkRuntimeEnv(readModelConnectorsNames[index])) {
      throw new Error(
        `${message.clientEnvError}.readModelConnectors[${
          readModelConnectorsNames[index]
        }]`
      )
    }
    constants.push(
      `const name_${index} = ${JSON.stringify(readModelConnectorsNames[index])}`
    )

    importResource({
      resourceName: `factory_${index}`,
      resourceValue: readModelConnector,
      runtimeMode: RUNTIME_ENV_ANYWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_CONSTRUCTOR,
      imports,
      constants
    })

    exports.push(`readModelConnectors[name_${index}] = factory_${index}`)
  }

  exports.push(`export default readModelConnectors`)

  return {
    code: [...imports, ...constants, ...exports].join('\r\n')
  }
}
