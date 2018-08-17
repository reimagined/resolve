import { message } from '../constants'
import resolveFile from '../resolve_file'
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
    const name = saga.name

    if (checkRuntimeEnv(saga.eventHandlers)) {
      throw new Error(`${message.clientEnvError}.sagas[${index}].eventHandlers`)
    }
    const eventHandlers = resolveFile(
      saga.eventHandlers,
      'saga_event_handlers.js'
    )

    if (checkRuntimeEnv(saga.cronHandlers)) {
      throw new Error(`${message.clientEnvError}.sagas[${index}].cronHandlers`)
    }

    const cronHandlers = resolveFile(saga.cronHandlers, 'saga_cron_handlers.js')

    constants.push(`const name_${index} = ${JSON.stringify(name)}`)

    imports.push(
      `import cronHandlers_${index} from ${JSON.stringify(cronHandlers)}`,
      `import eventHandlers_${index} from ${JSON.stringify(eventHandlers)}`,
      ``
    )

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
