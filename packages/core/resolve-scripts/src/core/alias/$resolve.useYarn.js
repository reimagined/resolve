import { message } from '../constants'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.useYarn`)
  }

  const exports = []

  exports.push(
    `const useYarn = ${JSON.stringify(resolveConfig.useYarn, null, 2)}`,
    ``,
    `export default useYarn`
  )

  return {
    code: exports.join('\r\n')
  }
}
