import {
  message,
  RESOURCE_ANY,
  RUNTIME_ENV_ANYWHERE,
  IMPORT_CONSTRUCTOR
} from '../constants'
import importResource from '../import_resource'
import { checkRuntimeEnv } from '../declare_runtime_env'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.schedulers`
    )
  }

  const imports = [``]
  const constants = [``]
  const exports = [``, `const schedulers = []`, ``]

  const schedulersNames = Object.keys(resolveConfig.schedulers)

  for (let index = 0; index < schedulersNames.length; index++) {
    const scheduler = resolveConfig.schedulers[schedulersNames[index]]
    if (checkRuntimeEnv(schedulersNames[index])) {
      throw new Error(
        `${message.clientEnvError}.schedulers[${schedulersNames[index]}]`
      )
    }

    constants.push(
      `const name_${index} = ${JSON.stringify(`${schedulersNames[index]}`)}`
    )

    constants.push(
      `const connectorName_${index} = ${JSON.stringify(
        scheduler.connectorName
      )}`
    )

    importResource({
      resourceName: `adapter_${index}`,
      resourceValue: scheduler.adapter,
      runtimeMode: RUNTIME_ENV_ANYWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_CONSTRUCTOR,
      calculateHash: 'resolve-scheduler-adapter-hash',
      imports,
      constants
    })

    exports.push(`schedulers.push({`, `  name: name_${index}`)
    exports.push(`, connectorName: connectorName_${index}`)
    exports.push(`, adapter: adapter_${index}`)
    exports.push(`, invariantHash: adapter_${index}_hash`)
    exports.push(`})`, ``)
  }

  exports.push(`export default schedulers`)

  return {
    code: [...imports, ...constants, ...exports].join('\r\n')
  }
}
