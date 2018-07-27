import { message } from '../constants'

export default ({ resolveConfig, isClient }) => {
  if (!resolveConfig.subscribeAdapter) {
    throw new Error(`${message.configNotContainSectionError}.subscribeAdapter`)
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
