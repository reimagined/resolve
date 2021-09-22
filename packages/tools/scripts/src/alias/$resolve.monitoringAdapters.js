import {
  message,
  RESOURCE_ANY,
  RUNTIME_ENV_ANYWHERE,
  IMPORT_CONSTRUCTOR,
} from '../constants'
import { injectRuntimeEnv } from '../declare_runtime_env'
import importResource from '../import_resource'

const importMonitoringAdapters = ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}.monitoringAdapters`
    )
  }

  const imports = [`import '$resolve.guardOnlyServer'`]
  const constants = [``]
  const exports = [`const monitoringAdapters = []`]

  for (
    let index = 0;
    index < resolveConfig.monitoringAdapters.length;
    index++
  ) {
    const adapterConfig = resolveConfig.monitoringAdapters[index]

    constants.push(`const name_${index} = ${JSON.stringify(adapterConfig)}`)

    importResource({
      resourceName: `factory_${index}`,
      resourceValue: adapterConfig,
      runtimeMode: RUNTIME_ENV_ANYWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_CONSTRUCTOR,
      imports,
      constants,
    })

    if (adapterConfig.constructor === Object && adapterConfig.options != null) {
      constants.push(
        `const options_s_${index} = ${injectRuntimeEnv(adapterConfig.options)}`
      )
    } else {
      constants.push(`const options_s_${index} = null`)
    }

    exports.push(`monitoringAdapters[${index}] = factory_${index}`)
  }

  exports.push(`export default monitoringAdapters`)

  return [...imports, ...constants, ...exports].join('\r\n')
}

export default importMonitoringAdapters
