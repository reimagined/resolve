import { message } from '../constants'
import { checkRuntimeEnv } from '../declare_runtime_env'

export default ({ resolveConfig }) => {
  if (!resolveConfig.jwtCookie) {
    throw new Error(`${message.configNotContainSectionError}.jwtCookie`)
  }

  for (const optionsKey of Object.keys(resolveConfig.jwtCookie)) {
    if (checkRuntimeEnv(resolveConfig.jwtCookie[optionsKey]) != null) {
      throw new Error(`${message.clientEnvError}.jwtCookie.${optionsKey}`)
    }
  }
  
  const exports = []

  exports.push(
    `const jwtCookie = ${JSON.stringify(resolveConfig.jwtCookie, null, 2)}`,
    ``,
    `export default jwtCookie`
  )

  return {
    code: exports.join('\r\n')
  }
}
