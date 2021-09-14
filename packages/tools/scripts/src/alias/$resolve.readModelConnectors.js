import {
  message,
  RESOURCE_ANY,
  RUNTIME_ENV_ANYWHERE,
  IMPORT_CONSTRUCTOR,
} from '../constants'
import { injectRuntimeEnv } from '../declare_runtime_env'
import { importResource } from '../import-resource'

const importReadModelConnectors = ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}.readModelConnectors`
    )
  }

  const imports = [
    `import '$resolve.guardOnlyServer'`,
    `import { wrapReadModelConnector } from '@resolve-js/runtime'`,
  ]
  const constants = [``]
  const exports = [`const readModelConnectors = {}`]

  const readModelConnectorsNames = Object.keys(
    resolveConfig.readModelConnectors
  )

  for (let index = 0; index < readModelConnectorsNames.length; index++) {
    const readModelConnector =
      resolveConfig.readModelConnectors[readModelConnectorsNames[index]]

    constants.push(
      `const name_${index} = ${JSON.stringify(readModelConnectorsNames[index])}`
    )

    if (readModelConnector.module == null) {
      readModelConnector.module = {
        package: '@resolve-js/runtime',
        import: 'emptyReadModelConnector',
      }
    }

    importResource({
      resourceName: `factory_s_${index}`,
      resourceValue: readModelConnector,
      runtimeMode: RUNTIME_ENV_ANYWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_CONSTRUCTOR,
      imports,
      constants,
    })

    if (
      readModelConnector.constructor === Object &&
      readModelConnector.options != null
    ) {
      constants.push(
        `const options_s_${index} = ${injectRuntimeEnv(
          readModelConnector.options
        )}`
      )
    } else {
      constants.push(`const options_s_${index} = null`)
    }

    constants.push(`
      const factory_${index} = (...args) => {
        return wrapReadModelConnector(factory_s_${index}(...args), options_s_${index}) 
      }
    `)

    exports.push(`readModelConnectors[name_${index}] = factory_${index}`)
  }

  exports.push(`export default readModelConnectors`)

  return [...imports, ...constants, ...exports].join('\r\n')
}

export default importReadModelConnectors
