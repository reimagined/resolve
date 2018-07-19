import { envKey } from 'json-env-extract'

import { message } from '../constants'

import resolveFile from '../resolve_file'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.sagas`)
  }

  if (!resolveConfig.sagas) {
    throw new Error(`${message.configNotContainSectionError}.sagas`)
  }

  if (resolveConfig.sagas in resolveConfig[envKey]) {
    throw new Error(`${message.clientEnvError}.sagas`)
  }
  const sagas = resolveFile(resolveConfig.sagas, 'common/sagas/sagas.js')

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
