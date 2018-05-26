import { message } from '../constants'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.clientAliasError}$resolve.auth`)
  }

  if (!resolveConfig.auth.strategies) {
    throw new Error(`${message.configNotContainSectionError}.auth`)
  }

  const exports = []

  exports.push(
    `import strategies from ${JSON.stringify(resolveConfig.auth.strategies)}`,
    ``,
    `const auth = {`,
    `  strategies`,
    `}`,
    ``,
    `export default auth`
  )

  return {
    code: exports.join('\r\n')
  }
}
