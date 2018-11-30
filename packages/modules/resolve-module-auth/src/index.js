import uuidV4 from 'uuid/v4'

const createUserModule = strategies => {
  if (!Array.isArray(strategies)) {
    throw new Error(`Module Auth accepts strategies argument only as array`)
  }

  const apiHandlers = []
  for (const strategyDescriptor of strategies) {
    const { createStrategy, options, routes, logoutRoute } = strategyDescriptor
    const strategyHash = uuidV4()
    if (options != null && options.constructor !== Object) {
      throw new Error(`Vary options should be object if present`)
    }

    for (const { method, path: routePath, callback } of routes) {
      apiHandlers.push({
        method,
        path: routePath,
        controller: {
          module: 'resolve-module-auth/lib/api_handler_constructor',
          options: {
            strategyHash,
            options
          },
          imports: {
            createStrategy,
            callback
          }
        }
      })
    }

    if (logoutRoute) {
      apiHandlers.push({
        method: logoutRoute.method,
        path: logoutRoute.path,
        controller: 'resolve-module-auth/lib/logout_api_handler'
      })
    }
  }

  return {
    apiHandlers
  }
}

export default createUserModule
