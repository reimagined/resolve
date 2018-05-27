import { injectEnv } from 'json-env-extract'

import { message } from '../constants'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.bus`)
  }

  if (!resolveConfig.bus) {
    throw new Error(`${message.configNotContainSectionError}.bus`)
  }

  const exports = []

  exports.push(
    `import interopRequireDefault from "@babel/runtime/helpers/interopRequireDefault"`,
    ``,
    `const bus = ${injectEnv(resolveConfig.bus)}`,
    `const adapter = interopRequireDefault(require(bus.adapter)).default`,
    `const options = bus.options`,
    ``,
    `export default { adapter, options }`
  )

  return {
    code: exports.join('\r\n')
  }
}
