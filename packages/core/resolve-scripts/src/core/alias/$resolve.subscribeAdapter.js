import { message } from '../constants'
import { checkRuntimeEnv } from '../declare_runtime_env'

export default ({ resolveConfig, isClient }) => {
  if (!resolveConfig.subscribeAdapter) {
    throw new Error(`${message.configNotContainSectionError}.subscribeAdapter`)
  }

  if (checkRuntimeEnv(resolveConfig.subscribeAdapter.module) != null) {
    throw new Error(`${message.clientEnvError}.subscribeAdapter.module`)
  }

  for (const option of Object.keys(resolveConfig.subscribeAdapter.options)) {
    if (
      checkRuntimeEnv(resolveConfig.subscribeAdapter.options[option]) != null
    ) {
      throw new Error(
        `${message.clientEnvError}.subscribeAdapter.options.${option}`
      )
    }
  }

  for (const option of Object.keys(resolveConfig.subscribeAdapter.options)) {
    if (
      checkRuntimeEnv(resolveConfig.subscribeAdapter.options[option]) != null
    ) {
      throw new Error(
        `${message.clientEnvError}.subscribeAdapter.options.${option}`
      )
    }
  }
  
  const options = {
    client: resolveConfig.subscribeAdapter.options.client || {},
    server: resolveConfig.subscribeAdapter.options.server || {}
  }

  const exports = []

  if (isClient) {
    exports.push(
      `import module from ${JSON.stringify(
        `${resolveConfig.subscribeAdapter.module}/dist/create_client_adapter`
      )}`,
      ``,
      `const options = ${JSON.stringify(options.client, null, 2)}`,
      ``,
      `export default { module, options }`
    )
  } else {
    exports.push(
      `import module from ${JSON.stringify(
        `${resolveConfig.subscribeAdapter.module}/dist/create_server_adapter`
      )}`,
      ``,
      `const options = ${JSON.stringify(options.server, null, 2)}`,
      ``,
      `export default { module, options }`
    )
  }

  return {
    code: exports.join('\r\n')
  }
}
