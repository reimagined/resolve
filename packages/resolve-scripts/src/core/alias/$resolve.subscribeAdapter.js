import { envKey } from 'json-env-extract'

import { message } from '../constants'

export default ({ resolveConfig }) => {
  if (!resolveConfig.subscribeAdapter) {
    throw new Error(`${message.configNotContainSectionError}.subscribeAdapter`)
  }

  if (resolveConfig.subscribeAdapter.module in resolveConfig[envKey]) {
    throw new Error(`${message.clientEnvError}.subscribeAdapter.module`)
  }
  for (const optionsKey of Object.keys(
    resolveConfig.subscribeAdapter.options
  )) {
    if (
      resolveConfig.subscribeAdapter.options[optionsKey] in
      resolveConfig[envKey]
    ) {
      throw new Error(
        `${message.clientEnvError}.subscribeAdapter.options.${optionsKey}`
      )
    }
  }

  const exports = []

  exports.push(
    `import module from ${JSON.stringify(
      resolveConfig.subscribeAdapter.module
    )}`,
    ``,
    `const options = ${JSON.stringify(
      resolveConfig.subscribeAdapter.options,
      null,
      2
    )}`,
    ``,
    `export default { module, options }`
  )

  return {
    code: exports.join('\r\n')
  }
}
