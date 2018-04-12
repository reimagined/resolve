import { Strategy as strategy } from 'passport-local'
import jwt from 'jsonwebtoken'
import jwtSecret from './jwtSecret'
import uuid from 'uuid'

import { rootDirectory } from '../client/constants'

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
    login: {
      path: '/login',
      method: 'POST'
    },
    logout: {
      path: '/logout',
      method: 'POST'
    }
  },

  registerCallback: async ({ resolve }, username) => {
    const { user: existingUser } = await resolve.executeReadModelQuery({
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
  },
  loginCallback: async ({ resolve }, username) => {
    const { user } = await resolve.executeReadModelQuery({
      modelName: 'default',
      resolverName: 'user',
      resolverArgs: { name: username.trim() }
    })

    if (!user) {
      throw new Error('No such user')
    }

    return jwt.sign(user, jwtSecret)
  },
  logoutCallback: async () => {
    return jwt.sign({}, jwtSecret)
  },
  failureCallback: (error, redirect) => {
    redirect(`${rootDirectory}/error?text=${error}`)
  }
}

export default [{ strategy, options }]
