import { envKey } from 'json-env-extract'

import { message } from '../constants'

export default ({ resolveConfig }) => {
  if (!resolveConfig.subscribe) {
    throw new Error(`${message.configNotContainSectionError}.subscribe`)
  }

  if (resolveConfig.subscribe.adapter in resolveConfig[envKey]) {
    throw new Error(`${message.clientEnvError}.subscribe.adapter`)
  }
  for (const optionsKey of Object.keys(resolveConfig.subscribe.options)) {
    if (resolveConfig.subscribe.options[optionsKey] in resolveConfig[envKey]) {
      throw new Error(
        `${message.clientEnvError}.subscribe.options.${optionsKey}`
      )
    }
  }

  const exports = []

  exports.push(
    `import adapter from ${JSON.stringify(resolveConfig.subscribe.adapter)}`,
    ``,
    `const options = ${JSON.stringify(
      resolveConfig.subscribe.options,
      null,
      2
    )}`,
    ``,
    `export default { adapter, options }`
  )

  return {
    code: exports.join('\r\n')
  }
}
