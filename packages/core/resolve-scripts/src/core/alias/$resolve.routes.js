import { envKey } from 'json-env-extract'

import { message } from '../constants'

import resolveFile from '../resolve_file'

export default ({ resolveConfig }) => {
  if (!resolveConfig.routes) {
    throw new Error(`${message.configNotContainSectionError}.routes`)
  }

  if (resolveConfig.routes in resolveConfig[envKey]) {
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
