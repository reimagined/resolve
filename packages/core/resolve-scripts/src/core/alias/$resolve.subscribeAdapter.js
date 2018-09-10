import { message } from '../constants'
import { checkRuntimeEnv } from '../declare_runtime_env'
import resolveFileOrModule from '../resolve_file_or_module'

export default ({ resolveConfig, isClient }) => {
  if (!resolveConfig.subscribeAdapter) {
    throw new Error(`${message.configNotContainSectionError}.subscribeAdapter`)
  }

  if (checkRuntimeEnv(resolveConfig.subscribeAdapter.module)) {
    throw new Error(`${message.clientEnvError}.subscribeAdapter.module`)
  }

  for (const option of Object.keys(resolveConfig.subscribeAdapter.options)) {
    if (checkRuntimeEnv(resolveConfig.subscribeAdapter.options[option])) {
      throw new Error(
        `${message.clientEnvError}.subscribeAdapter.options.${option}`
      )
    }
  }

  for (const option of Object.keys(resolveConfig.subscribeAdapter.options)) {
    if (checkRuntimeEnv(resolveConfig.subscribeAdapter.options[option])) {
      throw new Error(
        `${message.clientEnvError}.subscribeAdapter.options.${option}`
      )
    }
  }

  const exports = []

  const subscribeAdapter = {
    module: resolveFileOrModule(
      `${resolveConfig.subscribeAdapter.module}/lib/${
        isClient ? 'client' : 'server'
      }`
    ),
    options: isClient
      ? resolveConfig.subscribeAdapter.options.client || {}
      : resolveConfig.subscribeAdapter.options.server || {}
  }

  exports.push(
    `import module from ${JSON.stringify(`${subscribeAdapter.module}`)}`,
    ``,
    `const options = ${JSON.stringify(subscribeAdapter.options, null, 2)}`,
    ``,
    `export default { module, options }`
  )

  return {
    code: exports.join('\r\n')
  }
}
