import { message } from '../constants'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.openBrowser`
    )
  }

  const exports = []

  exports.push(
    `const openBrowser = ${JSON.stringify(resolveConfig.openBrowser, null, 2)}`,
    ``,
    `export default openBrowser`
  )

  return {
    code: exports.join('\r\n')
  }
}
