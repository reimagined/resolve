import { Strategy as LocalStrategy } from 'passport-local'
import uuid from 'uuid'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

import jwtSecret from './jwtSecret'

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

        const jwtToken = jwt.sign(
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
          }
        })

        await resolve.executeCommand(
          {
            type: 'createList',
            aggregateId: userId,
            aggregateName: 'ShoppingList',
            payload: {
              name: 'Shopping List'
            }
          },
          jwtToken
        )

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
        return jwt.sign({}, jwtSecret)
      }
    }
  }
]

export default strategies
