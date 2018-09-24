import { Strategy as LocalStrategy } from 'passport-local'
import uuid from 'uuid/v4'
import crypto from 'crypto'
import JWT from 'jsonwebtoken'

import jwtSecret from './jwt_secret'

const ROOT_JWT_TOKEN = JWT.sign(
  {
    username: 'root',
    id: '00000000-0000-0000-0000-000000000000',
    role: 'root'
  },
  jwtSecret
)

const failureRedirect = error => `/error?text=${error.message.toString()}`
const errorRedirect = error => `/error?text=${error.message.toString()}`

const localStrategyConstructor = options => {
  return new LocalStrategy(
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

const strategies = [
  {
    strategyConstructor: localStrategyConstructor,
    options: {
      strategy: {
        usernameField: 'username',
        passwordField: 'password',
        successRedirect: null
      },
      route: {
        path: '/auth/local/register',
        method: 'POST'
      },
      failureRedirect,
      errorRedirect,
      callback: async ({ resolve }, username, password) => {
        if (!password) {
          throw new Error('The "password" field is required')
        }

        const hmac = crypto.createHmac('sha512', jwtSecret)
        hmac.update(password)

        const passwordHash = hmac.digest('hex')

        const existingUser = await resolve.executeQuery({
          modelName: 'ShoppingLists',
          resolverName: 'user',
          resolverArgs: {
            username
          }
        })

        if (existingUser) {
          throw new Error('User can not be created')
        }

        const userId = uuid()

        const jwtToken = JWT.sign(
          {
            username: username.trim(),
            id: userId
          },
          jwtSecret
        )

        await resolve.executeCommand({
          type: 'createUser',
          aggregateId: userId,
          aggregateName: 'User',
          payload: {
            username,
            passwordHash
          },
          jwtToken: ROOT_JWT_TOKEN
        })

        await resolve.executeCommand({
          type: 'createShoppingList',
          aggregateId: userId,
          aggregateName: 'ShoppingList',
          payload: {
            name: 'Shopping List'
          },
          jwtToken
        })

        return jwtToken
      }
    }
  },
  {
    strategyConstructor: localStrategyConstructor,
    options: {
      strategy: {
        usernameField: 'username',
        passwordField: 'password',
        successRedirect: null
      },
      route: {
        path: '/auth/local/login',
        method: 'POST'
      },
      failureRedirect,
      errorRedirect,
      callback: async ({ resolve }, username, password) => {
        const user = await resolve.executeQuery({
          modelName: 'ShoppingLists',
          resolverName: 'user',
          resolverArgs: { username }
        })

        const hmac = crypto.createHmac('sha512', jwtSecret)
        hmac.update(password)

        const passwordHash = hmac.digest('hex')

        if (!user || user.passwordHash !== passwordHash) {
          throw new Error('Incorrect username or password')
        }

        return JWT.sign(user, jwtSecret)
      }
    }
  },
  {
    strategyConstructor: localStrategyConstructor,
    options: {
      strategy: {
        usernameField: 'username',
        passwordField: 'password',
        successRedirect: null
      },
      route: {
        path: '/auth/logout',
        method: 'get'
      },
      failureRedirect,
      errorRedirect,
      callback: async () => {
        return JWT.sign({}, jwtSecret)
      }
    }
  }
]

export default strategies
