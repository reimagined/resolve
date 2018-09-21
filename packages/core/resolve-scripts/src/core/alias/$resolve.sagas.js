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

  if (!resolveConfig.sagas) {
    throw new Error(`${message.configNotContainSectionError}.sagas`)
  }

  if (checkRuntimeEnv(resolveConfig.sagas)) {
    throw new Error(`${message.clientEnvError}.sagas`)
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

    importResource({
      resourceName: `eventHandlers_${index}`,
      resourceValue: saga.eventHandlers,
      runtimeMode: RUNTIME_ENV_ANYWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      instanceFallback: 'saga_event_handlers.js',
      imports,
      constants
    })

    importResource({
      resourceName: `cronHandlers_${index}`,
      resourceValue: saga.cronHandlers,
      runtimeMode: RUNTIME_ENV_ANYWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      instanceFallback: 'saga_cron_handlers.js',
      imports,
      constants
    })

    exports.push(`sagas.push({`, `  name: name_${index}`)
    exports.push(`, cronHandlers: cronHandlers_${index}`)
    exports.push(`, eventHandlers: eventHandlers_${index}`)
    exports.push(`})`, ``)
  }

  exports.push(`export default sagas`)

  return {
    code: [...imports, ...constants, ...exports].join('\r\n')
  }
}
