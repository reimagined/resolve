import { message } from '../constants'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.sagas`)
  }

  if (!resolveConfig.sagas) {
    throw new Error(`${message.configNotContainSectionError}.sagas`)
  }

  const exports = []

  exports.push(
    `import sagas from ${JSON.stringify(resolveConfig.sagas)}`,
    ``,
    `export default sagas`
  )

  return {
    code: exports.join('\r\n')
  }
}
