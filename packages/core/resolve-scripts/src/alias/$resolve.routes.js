import { message } from '../constants'
import resolveFile from '../resolve_file'
import { checkRuntimeEnv } from '../declare_runtime_env'

export default ({ resolveConfig }) => {
  if (checkRuntimeEnv(resolveConfig.routes)) {
    throw new Error(`${message.clientEnvError}.routes`)
  }
  const routes = resolveFile(resolveConfig.routes)

  const exports = []

  exports.push(
    `import routes from ${JSON.stringify(routes)}`,
    ``,
    `export default routes`
  )

  return {
    code: exports.join('\r\n')
  }
}
