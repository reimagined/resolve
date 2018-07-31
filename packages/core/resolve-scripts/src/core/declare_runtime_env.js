const runtimeEnvSymbol = Symbol('@@resolve/runtime_env')

const declareRuntimeEnv = envName => {
  if (envName == null || envName.constructor !== String) {
    throw new Error('Runtime environment variable should be an string')
  }

  // eslint-disable-next-line no-new-wrappers
  const envContainer = new String(envName)
  envContainer.type = runtimeEnvSymbol

  return envContainer
}

export const checkRuntimeEnv = value =>
  !(value == null || value.type !== runtimeEnvSymbol)

export const injectRuntimeEnv = json =>
  JSON.stringify(
    json,
    (key, value) => {
      if (checkRuntimeEnv(value)) {
        return `process.env[${JSON.stringify(value)}]`
      }

      return value
    },
    2
  )

export default declareRuntimeEnv
