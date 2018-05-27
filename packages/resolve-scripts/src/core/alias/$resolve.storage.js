import { injectEnv } from 'json-env-extract'

import { message } from '../constants'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.storage`)
  }

  if (!resolveConfig.storage) {
    throw new Error(`${message.configNotContainSectionError}.storage`)
  }

  const exports = []

  exports.push(
    `import interopRequireDefault from "@babel/runtime/helpers/interopRequireDefault"`,
    ``,
    `const storage = ${injectEnv(resolveConfig.storage)}`,
    `const adapter = interopRequireDefault(require(storage.adapter)).default`,
    `const options = storage.options`,
    ``,
    `export default { adapter, options }`
  )

  return {
    code: exports.join('\r\n')
  }
}
