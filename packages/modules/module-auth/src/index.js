import { v4 as uuid } from 'uuid'

const createUserModule = (strategies) => {
  if (!Array.isArray(strategies)) {
    throw new Error(`Module Auth accepts strategies argument only as array`)
  }

  const apiHandlers = []
  for (const strategyDescriptor of strategies) {
    const { createStrategy, options, routes, logoutRoute } = strategyDescriptor
    const strategyHash = uuid()
    if (options != null && options.constructor !== Object) {
      throw new Error(`Vary options should be object if present`)
    }

    for (const { method, path: routePath, callback } of routes) {
      apiHandlers.push({
        method,
        path: `/api/${routePath}`,
        handler: {
          module: '@resolve-js/module-auth/lib/api_handler_constructor',
          options: {
            strategyHash,
            options,
          },
          imports: {
            createStrategy,
            callback,
          },
        },
      })
    }

    if (logoutRoute) {
      apiHandlers.push({
        method: logoutRoute.method,
        path: `/api/${logoutRoute.path}`,
        handler: '@resolve-js/module-auth/lib/logout_api_handler',
      })
    }
  }

  return {
    apiHandlers,
  }
}

export default createUserModule
