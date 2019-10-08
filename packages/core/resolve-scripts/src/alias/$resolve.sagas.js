import {
  message,
  RESOURCE_ANY,
  RUNTIME_ENV_ANYWHERE,
  IMPORT_INSTANCE
} from '../constants'
import importResource from '../import_resource'
import { checkRuntimeEnv } from '../declare_runtime_env'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.sagas`)
  }

  const imports = [``]
  const constants = [``]
  const exports = [``, `const sagas = []`, ``]

  for (let index = 0; index < resolveConfig.sagas.length; index++) {
    const saga = resolveConfig.sagas[index]

    if (checkRuntimeEnv(saga.name)) {
      throw new Error(`${message.clientEnvError}.sagas[${index}].name`)
    }
    constants.push(`const name_${index} = ${JSON.stringify(saga.name)}`)

    constants.push(
      `const connectorName_${index} = ${JSON.stringify(saga.connectorName)}`
    )
    constants.push(
      `const schedulerName_${index} = ${JSON.stringify(saga.schedulerName)}`
    )

    if (
      saga.schedulerName != null &&
      resolveConfig.schedulers[saga.schedulerName] == null
    ) {
      throw new Error(
        `${message.configNotContainSectionError}.schedulers[${saga.schedulerName}]`
      )
    }

    importResource({
      resourceName: `source_${index}_original`,
      resourceValue: saga.source,
      runtimeMode: RUNTIME_ENV_ANYWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      calculateHash: 'resolve-saga-source-hash',
      imports,
      constants
    })

    if (saga.sideEffects != null) {
      importResource({
        resourceName: `sideEffects_${index}_original`,
        resourceValue: saga.sideEffects,
        runtimeMode: RUNTIME_ENV_ANYWHERE,
        importMode: RESOURCE_ANY,
        instanceMode: IMPORT_INSTANCE,
        calculateHash: 'resolve-saga-side-effects-hash',
        imports,
        constants
      })
    } else {
      constants.push(`const sideEffects_${index}_original = null`)
    }

    constants.push(`const handlers_${index} = sideEffects_${index}_original == null
      ? source_${index}_original.handlers
      : source_${index}_original
    `)

    constants.push(`const sideEffects_${index} = sideEffects_${index}_original == null
      ? source_${index}_original.sideEffects
      : sideEffects_${index}_original
    `)

    constants.push(`const invariantHash_${index} = sideEffects_${index}_original != null
      ? source_${index}_original_hash + sideEffects_${index}_original_hash
      : source_${index}_original_hash
    `)

    exports.push(`sagas.push({`, `  name: name_${index}`)
    exports.push(`, connectorName: connectorName_${index}`)
    exports.push(`, schedulerName: schedulerName_${index}`)
    exports.push(`, handlers: handlers_${index}`)
    exports.push(`, sideEffects: sideEffects_${index}`)
    exports.push(`, invariantHash: invariantHash_${index}`)
    exports.push(`})`, ``)
  }

  exports.push(`export default sagas`)

  return {
    code: [...imports, ...constants, ...exports].join('\r\n')
  }
}
