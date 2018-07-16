import { injectEnv, envKey } from 'json-env-extract'

import { message } from '../constants'

export default ({ resolveConfig, isClient }) => {
  if (!resolveConfig.subscribeAdapter) {
    throw new Error(`${message.configNotContainSectionError}.subscribeAdapter`)
  }

  if (resolveConfig.subscribeAdapter.module in resolveConfig[envKey]) {
    throw new Error(`${message.clientEnvError}.subscribeAdapter.module`)
  }

  for (const option of Object.keys(resolveConfig.subscribeAdapter.options)) {
    if (
      resolveConfig.subscribeAdapter.options[option] in resolveConfig[envKey]
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

  for (const optionsKey of Object.keys(options.client)) {
    if (options.client[optionsKey] in resolveConfig[envKey]) {
      throw new Error(
        `${
          message.clientEnvError
        }.subscribeAdapter.options.client.${optionsKey}`
      )
    }
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
      `const options = ${injectEnv(options.server, null, 2)}`,
      ``,
      `export default { module, options }`
    )
  }

  return {
    code: exports.join('\r\n')
  }
}
