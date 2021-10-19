import { message } from '../constants'
import declareRuntimeEnv, {
  checkRuntimeEnv,
  injectRuntimeEnv,
} from '../declare_runtime_env'

const CLIENT_ENV_KEY = '__CLIENT_ENV__'

const seedClientEnvs = ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.seedClientEnvs`
    )
  }
  if (!resolveConfig.hasOwnProperty(CLIENT_ENV_KEY)) {
    Object.defineProperty(resolveConfig, CLIENT_ENV_KEY, {
      value: {
        showInformationWarn: true,
        exposedEnvs: new Set(),
      },
      enumerable: false,
    })
  }

  const clientEnvs = [declareRuntimeEnv('RESOLVE_UPLOADER_CDN_URL')]

  const configEnvs = [
    resolveConfig.customConstants,
    resolveConfig.staticPath,
    resolveConfig.rootPath,
    resolveConfig.jwtCookie,
    ...(Array.isArray(resolveConfig.viewModels)
      ? resolveConfig.viewModels.map((viewModel) => viewModel.projection)
      : []),
    ...(resolveConfig.clientImports != null &&
    Object(resolveConfig.clientImports) === resolveConfig.clientImports
      ? Object.keys(resolveConfig.clientImports).map(
          (key) => resolveConfig.clientImports[key]
        )
      : []),
  ]

  void JSON.stringify(configEnvs, (key, value) => {
    if (checkRuntimeEnv(value)) {
      clientEnvs.push(value)
    }
    return value
  })

  const seededEnvKeys = new Set()
  for (let index = clientEnvs.length - 1; index >= 0; index--) {
    const key = `${clientEnvs[index]}`
    if (seededEnvKeys.has(key)) {
      clientEnvs.splice(index, 1)
    } else {
      seededEnvKeys.add(key)
    }
  }

  /* eslint-disable no-console */
  if (clientEnvs.length > 0) {
    if (resolveConfig[CLIENT_ENV_KEY].showInformationWarn) {
      console.log('Following environment variables will be sent into browser:')
      resolveConfig[CLIENT_ENV_KEY].showInformationWarn = false
    }
    for (const env of clientEnvs) {
      if (!resolveConfig[CLIENT_ENV_KEY].exposedEnvs.has(env)) {
        console.log(` * ${env}`)
        resolveConfig[CLIENT_ENV_KEY].exposedEnvs.add(env)
      }
    }
  }
  /* eslint-enable no-console */

  const exports = [
    `import '$resolve.guardOnlyServer'`,
    `const seedClientEnvs = {}`,
  ]

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

  return exports.join('\r\n')
}

export default seedClientEnvs
