import {
  message,
  RESOURCE_ANY,
  RUNTIME_ENV_ANYWHERE,
  IMPORT_INSTANCE,
  RUNTIME_ENV_NOWHERE,
} from '../constants'
import { importResource } from '../import-resource'
import { checkRuntimeEnv } from '../declare_runtime_env'

const importSagas = ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.sagas`)
  }

  const imports = [`import '$resolve.guardOnlyServer'`]
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

    importResource({
      resourceName: `source_${index}_original`,
      resourceValue: saga.source,
      runtimeMode: RUNTIME_ENV_ANYWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      calculateHash: 'resolve-saga-source-hash',
      imports,
      constants,
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
        constants,
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

    importResource({
      resourceName: `encryption_${index}`,
      resourceValue: saga.encryption,
      runtimeMode: RUNTIME_ENV_NOWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      instanceFallback: '@resolve-js/runtime/lib/common/defaults/encryption.js',
      imports,
      constants,
    })

    // FIXME: why 'handlers' not 'projection' here?

    exports.push(`sagas.push({`, `  name: name_${index}`)
    exports.push(`, connectorName: connectorName_${index}`)
    exports.push(`, handlers: handlers_${index}`)
    exports.push(`, sideEffects: sideEffects_${index}`)
    exports.push(`, invariantHash: invariantHash_${index}`)
    exports.push(`, encryption: encryption_${index}`)
    exports.push(`})`, ``)
  }

  exports.push(`export default sagas`)

  return [...imports, ...constants, ...exports].join('\r\n')
}

export default importSagas
