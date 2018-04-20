import { Strategy } from 'passport-local'
import jwt from 'jsonwebtoken'
import jwtSecret from './jwtSecret'

import { getRootableUrl } from 'resolve-auth'

const options = {
  strategy: {
    usernameField: 'username',
    passwordField: 'username',
    successRedirect: null
  },
  routes: {
    register: {
      path: '/register',
      method: 'POST'
    },
    logout: {
      path: '/logout',
      method: 'POST'
    }
  },
  registerCallback: async (_, username) => {
    return jwt.sign(
      {
        name: username
      },
      jwtSecret
    )
  },
  logoutCallback: async () => {
    return jwt.sign({}, jwtSecret)
  }
}

const routeToCbMap = {
  register: 'registerCallback',
  logout: 'logoutCallback'
}

const strategyConstructor = options => {
  const callbacks = {}

  for (const [routeName, callbackName] of Object.entries(routeToCbMap)) {
    const route = options.routes[routeName]
    if (route && route.path) {
      callbacks[getRootableUrl(route.path)] = options[callbackName]
    }
  }

  return new Strategy(
    {
      ...options.strategy,
      passReqToCallback: true
    },
    async (req, username, password, done) => {
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
  )
}

export default [{ strategyConstructor, options }]
