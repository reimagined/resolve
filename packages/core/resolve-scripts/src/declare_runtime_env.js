import crypto from 'crypto'
import getClientGlobalObject from './client_global_object'

const runtimeEnvSymbol = Symbol('@@resolve/runtime_env')

const createDigestHash = (prefix, content) => {
  const hmac = crypto.createHmac('sha512', prefix)
  hmac.update(content)
  return hmac.digest('hex')
}

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

export const injectRuntimeEnv = (json, isClient = false) => {
  const seedPrefix = JSON.stringify(json)
  const runtimeDigestBegin = createDigestHash('digest-begin', seedPrefix)
  const runtimeDigestEnd = createDigestHash('digest-end', seedPrefix)

  const envObj = isClient
    ? getClientGlobalObject('__RESOLVE_RUNTIME_ENV__')
    : 'process.env'

  const rawResult = JSON.stringify(
    json,
    (key, value) => {
      if (checkRuntimeEnv(value)) {
        return `${runtimeDigestBegin}${value}${runtimeDigestEnd}`
      }

      return value
    },
    2
  )

  const runtimeEnvRegex = new RegExp(
    `"${runtimeDigestBegin}((?:.|\\n)*?)${runtimeDigestEnd}"`,
    'ig'
  )

  const result = rawResult.replace(runtimeEnvRegex, (match, group) => {
    return `${envObj}[${JSON.stringify(group)}]`
  })

  return result
}

export default declareRuntimeEnv
