import { message } from '../constants'
import { checkRuntimeEnv, injectRuntimeEnv } from '../declare_runtime_env'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.eventBroker`
    )
  }

  const exports = [
    `import '$resolve.guardOnlyServer'`,
    `const eventBroker = {}`
  ]
  for (const key of Object.keys(resolveConfig.eventBroker)) {
    const value = resolveConfig.eventBroker[key]
    if (key === 'launchBroker' && checkRuntimeEnv(value)) {
      throw new Error(
        'Forbidden runtime injection: $resolve.eventBroker.launchBroker'
      )
    }

    if (checkRuntimeEnv(value)) {
      exports.push(
        `eventBroker[${JSON.stringify(key)}] = ${injectRuntimeEnv(value)}`
      )
    } else {
      exports.push(
        `eventBroker[${JSON.stringify(key)}] = ${JSON.stringify(value)}`
      )
    }
  }

  exports.push('export default eventBroker')

  return exports.join('\r\n')
}
