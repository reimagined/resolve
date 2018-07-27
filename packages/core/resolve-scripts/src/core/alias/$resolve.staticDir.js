import { message } from '../constants'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.staticDir`)
  }

  if (!resolveConfig.distDir) {
    throw new Error(`${message.configNotContainSectionError}.staticDir`)
  }

  const exports = []

  exports.push(
    `const staticDir = ${JSON.stringify(resolveConfig.staticDir, null, 2)}`,
    ``,
    `export default staticDir`
  )

  return {
    code: exports.join('\r\n')
  }
}
