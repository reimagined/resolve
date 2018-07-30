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
  const sagas = resolveFile(resolveConfig.sagas, 'sagas.js')

  const exports = []

  exports.push(
    `import sagas from ${JSON.stringify(sagas)}`,
    ``,
    `export default sagas`
  )

  return {
    code: exports.join('\r\n')
  }
}
