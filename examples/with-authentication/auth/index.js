import { Strategy } from 'passport-local'
import jwt from 'jsonwebtoken'
import jwtSecret from './jwtSecret'

const strategyOptions = {
  strategy: {
    usernameField: 'username',
    passwordField: 'username',
    successRedirect: null
  }
}

const routes = [
  {
    path: '/register',
    method: 'POST',
    callback: async (_, username) => {
      return jwt.sign(
        {
          name: username
        },
        jwtSecret
      )
    }
  },
  {
    path: '/logout',
    method: 'POST',
    callback: async () => {
      return jwt.sign({}, jwtSecret)
    }
  }
]

const options = routes.map(({ path, method, callback }) => ({
  ...strategyOptions,
  route: {
    path,
    method
  },
  callback,
  buildResponse: (resExpress, response) => {
    resExpress.statusCode = response.statusCode
    Object.keys(response.headers || {}).forEach(key => {
      resExpress.setHeader(key, response.headers[key])
    })
    Object.keys(response.cookies || {}).forEach(key => {
      resExpress.cookie(
        key,
        response.cookies[key].value,
        response.cookies[key].options
      )
    })

    resExpress.end(response.error)
  },
  jwtSecret
}))

const strategyConstructor = options => {
  return new Strategy(
    {
      ...options.strategy,
      passReqToCallback: true
    },
    async (req, username, password, done) => {
      try {
        done(null, await options.callback(req, username, password))
      } catch (error) {
        done(error)
      }
    }
  )
}

const strategies = options.map(options => ({
  options,
  strategyConstructor
}))

export default strategies
