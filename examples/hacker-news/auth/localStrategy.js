import { Strategy as strategy } from 'passport-local'
import jwt from 'jsonwebtoken'
import uuid from 'uuid'

import { rootPath } from '../client/constants'

const jwtSecret = process.env.JWT_SECRET || 'SECRETJWT'

const getUserByName = async (executeQuery, name) => {
  const { user } = await executeQuery('user', { name: name.trim() })
  return user
}

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

  registerCallback: async (
    { executeCommand, readModelQueryExecutors },
    username
  ) => {
    const existingUser = await getUserByName(
      readModelQueryExecutors.default,
      username
    )

    if (existingUser) {
      throw new Error('User already exists')
    }

    const user = {
      name: username.trim(),
      id: uuid.v4()
    }

    await executeCommand({
      type: 'createUser',
      aggregateId: user.id,
      aggregateName: 'user',
      payload: user
    })
    return jwt.sign(user, jwtSecret)
  },
  loginCallback: async ({ readModelQueryExecutors }, username) => {
    const user = await getUserByName(readModelQueryExecutors.default, username)

    if (!user) {
      throw new Error('No such user')
    }

    return jwt.sign(user, jwtSecret)
  },
  logoutCallback: async () => {
    return undefined
  },
  failureCallback: (error, redirect) => {
    redirect(`${rootPath}/error?text=${error}`)
  }
}

export default [{ strategy, options }]
