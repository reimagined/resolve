import crypto from 'crypto'
import {
  runtimeEnvSymbol,
  declareRuntimeEnv,
  checkRuntimeEnv,
} from '@resolve-js/core'
import getClientGlobalObject from './client_global_object'

const createDigestHash = (prefix, content) => {
  const hmac = crypto.createHmac('sha512', prefix)
  hmac.update(content)
  return hmac.digest('hex')
}

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
        return `${runtimeDigestBegin}${JSON.stringify({
          envName: String(value),
          defaultValue: value.defaultValue,
        })}${runtimeDigestEnd}`
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
    const { envName, defaultValue } = JSON.parse(JSON.parse(`"${group}"`))

    const first = `${envObj}[${JSON.stringify(envName)}]`
    const second = JSON.stringify(defaultValue)
    const choice = `(first, second) => (first != null ? first : second)`

    return `((${choice})(${first}, ${second}))`
  })

  return result
}

export { runtimeEnvSymbol, declareRuntimeEnv, checkRuntimeEnv }

export default declareRuntimeEnv
