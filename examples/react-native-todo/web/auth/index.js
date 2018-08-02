import uuid from 'uuid'
import crypto from 'crypto'
import { Strategy } from 'passport-local'
import jwt from 'jsonwebtoken'
import jwtSecret from './jwtSecret'

const strategyOptions = {
  strategy: {
    usernameField: 'username',
    passwordField: 'password',
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
    callback: async ({ resolve }, username, password) => {
      if (!password) {
        throw new Error('The "password" field is required')
      }
    
      const hmac = crypto.createHmac('sha512', jwtSecret)
      hmac.update(password)
  
      const passwordHash = hmac.digest('hex')
      
      const existingUser = await resolve.executeReadModelQuery({
        modelName: 'Default',
        resolverName: 'user',
        resolverArgs: {
          username
        }
      })

      if (existingUser) {
        throw new Error('User already exists')
      }

      const userId = uuid.v4()

      await resolve.executeCommand({
        type: 'createUser',
        aggregateId: userId,
        aggregateName: 'user',
        payload: {
          username,
          passwordHash
        }
      })

      return jwt.sign({
        username: username.toLowerCase().trim(),
        id: userId
      }, jwtSecret)
    }
  },
  {
    path: '/login',
    method: 'POST',
    callback: async ({ resolve }, username, password) => {
      const user = await resolve.executeReadModelQuery({
        modelName: 'default',
        resolverName: 'user',
        resolverArgs: { username }
      })
  
      const hmac = crypto.createHmac('sha512', jwtSecret)
      hmac.update(password)
  
      const passwordHash = hmac.digest('hex')

      if (!user) {
        throw new Error('No such user')
      }
  
      if (user.passwordHash !== passwordHash) {
        throw new Error('Incorrect username or password')
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
  ...authenticateOptions
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
