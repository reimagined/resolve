import { Strategy as strategy } from 'passport-local'
import jwt from 'jsonwebtoken'
//import uuid from 'uuid'

import { rootDirectory } from '../client/constants'

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

  registerCallback: async (/*req, username*/) => {
    //    console.log(Object.keys(req))

    /*
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
*/
    return jwt.sign('user', process.env.JWT_SECRET || 'SECRETJWT')
  },
  loginCallback: async ({ readModelQueryExecutors }, username) => {
    const user = await getUserByName(readModelQueryExecutors.default, username)

    if (!user) {
      throw new Error('No such user')
    }

    return jwt.sign(user, process.env.JWT_SECRET || 'SECRETJWT')
  },
  logoutCallback: async () => {
    return ''
  },
  failureCallback: (error, redirect) => {
    redirect(`${rootDirectory}/error?text=${error}`)
  }
}

export default [{ strategy, options }]
