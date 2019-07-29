import { message } from '../constants'
import { checkRuntimeEnv, injectRuntimeEnv } from '../declare_runtime_env'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.seedClientEnvs`
    )
  }

  const clientEnvs = []

  void JSON.stringify(
    [
      resolveConfig.customConstants,
      resolveConfig.staticPath,
      resolveConfig.rootPath
    ],
    (key, value) => {
      if (checkRuntimeEnv(value)) {
        clientEnvs.push(value)
      }
      return value
    }
  )

  /* eslint-disable no-console */
  if (clientEnvs.length > 0) {
    console.log('Following environment variables will be sent into browser:')
    clientEnvs.forEach(env => console.log(` * ${env}`))
    console.log('')
  }
  /* eslint-enable no-console */

  const exports = [`const seedClientEnvs = {}`, ``]

  for (const clientEnv of clientEnvs) {
    exports.push(`Object.defineProperty(
      seedClientEnvs,
      ${JSON.stringify(clientEnv)},
      {
        enumerable: true,
        get: () => {
          return ${injectRuntimeEnv(clientEnv)}
        }
      }
    )`)
  }

  exports.push(
    `Object.freeze(seedClientEnvs)`,
    ``,
    `export default seedClientEnvs`
  )

  return {
    code: exports.join('\r\n')
  }
}
