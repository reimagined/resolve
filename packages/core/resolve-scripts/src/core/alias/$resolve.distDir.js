import { message } from '../constants'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.distDir`)
  }

  if (!resolveConfig.distDir) {
    throw new Error(`${message.configNotContainSectionError}.distDir`)
  }

  const exports = []

  exports.push(
    `const distDir = ${JSON.stringify(resolveConfig.distDir, null, 2)}`,
    ``,
    `export default distDir`
  )

  return {
    code: exports.join('\r\n')
  }
}
