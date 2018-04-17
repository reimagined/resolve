import { getRouteByName, getRootableUrl } from '../helpers'

const routeMap = {
  register: 'registerCallback',
  login: 'loginCallback',
  logout: 'logoutCallback'
}

export default options => {
  const callbacks = {}

  for (const [routeName, callbackName] of Object.entries(routeMap)) {
    const route = getRouteByName(routeName, options.routes)
    if (route && route.path) {
      callbacks[getRootableUrl(route.path)] = options[callbackName]
    }
  }

  return async (req, username, password, done) => {
    try {
      const path = req.originalUrl.split('?')[0]

      const callback = callbacks[path]
      if (callback) {
        done(null, await callback(req, username, password))
      } else {
        done(new Error(`Route not found: ${path}`))
      }
    } catch (error) {
      done(error)
    }
  }
}
