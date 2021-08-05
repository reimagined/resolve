import { checkRuntimeEnv } from '../declare_runtime_env'
import { message } from '../constants'

const importStaticRoutes = ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.staticRoutes`
    )
  }
  const exports = [`import '$resolve.guardOnlyServer'`]

  const staticRoutes = resolveConfig.staticRoutes ?? null
  if (staticRoutes != null) {
    exports.push(`const staticRoutes = []`)
    for (let index = 0; index < staticRoutes.length; index++) {
      const [staticRoute, maybeMappedStaticFile] = Array.isArray(
        staticRoutes[index]
      )
        ? staticRoutes[index]
        : [staticRoutes[index]]

      if (
        checkRuntimeEnv(staticRoute) ||
        checkRuntimeEnv(maybeMappedStaticFile)
      ) {
        throw new Error(`${message.clientEnvError}.staticRoutes[${index}]`)
      }

      exports.push(
        `staticRoutes.push([${JSON.stringify(staticRoute)}, ${JSON.stringify(
          maybeMappedStaticFile
        )} ])`
      )
    }
  } else {
    exports.push(`const staticRoutes = null `)
  }

  exports.push(``)

  exports.push(`export default staticRoutes`)

  return exports.join('\r\n')
}

export default importStaticRoutes
