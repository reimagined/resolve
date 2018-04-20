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
  callback
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
