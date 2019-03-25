import { message } from '../constants'
import { checkRuntimeEnv, injectRuntimeEnv } from '../declare_runtime_env'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.eventBroker`
    )
  }

  if (resolveConfig.eventBroker == null) {
    throw new Error(`${message.configNotContainSectionError}.eventBroker`)
  }

  const exports = []

  if (checkRuntimeEnv(resolveConfig.eventBroker)) {
    exports.push(
      `const eventBroker = ${injectRuntimeEnv(resolveConfig.eventBroker)}`,
      ``,
      `export default eventBroker`
    )
  } else {
    exports.push(
      `const eventBroker = ${JSON.stringify(resolveConfig.eventBroker)}`,
      ``,
      `export default eventBroker`
    )
  }

  return {
    code: exports.join('\r\n')
  }
}
