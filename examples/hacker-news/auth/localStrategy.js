import { Strategy } from 'passport-local'
import jwt from 'jsonwebtoken'
import jwtSecret from './jwtSecret'
import uuid from 'uuid'

const strategyOptions = {
  strategy: {
    usernameField: 'username',
    passwordField: 'username',
    successRedirect: null
  }
}

const authenticateOptions = {
  failureRedirect: error => `/error?text=${error}`,
  errorRedirect: error => `/error?text=${error}`
}

const routes = [
  {
    path: '/register',
    method: 'POST',
    callback: async ({ resolve }, username) => {
      const existingUser = await resolve.executeReadModelQuery({
        modelName: 'default',
        resolverName: 'user',
        resolverArgs: { name: username.trim() }
      })

      if (existingUser) {
        throw new Error('User already exists')
      }

      const user = {
        name: username.trim(),
        id: uuid.v4()
      }

      await resolve.executeCommand({
        type: 'createUser',
        aggregateId: user.id,
        aggregateName: 'user',
        payload: user
      })

      return jwt.sign(user, jwtSecret)
    }
  },
  {
    path: '/login',
    method: 'POST',
    callback: async ({ resolve }, username) => {
      const user = await resolve.executeReadModelQuery({
        modelName: 'default',
        resolverName: 'user',
        resolverArgs: { name: username.trim() }
      })

      if (!user) {
        throw new Error('No such user')
      }

      return jwt.sign(user, jwtSecret)
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
  ...authenticateOptions,
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
