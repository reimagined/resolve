import { message } from '../constants'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.jwtCookie`)
  }

  if (!resolveConfig.jwtCookie) {
    throw new Error(`${message.configNotContainSectionError}.jwtCookie`)
  }

  const exports = []

  exports.push(
    `const jwtCookie = ${JSON.stringify(resolveConfig.jwtCookie, null, 2)}`,
    ``,
    `export default jwtCookie`
  )

  return {
    code: exports.join('\r\n')
  }
}
