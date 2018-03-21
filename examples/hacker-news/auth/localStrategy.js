import uuid from 'uuid'

import { rootDirectory } from '../client/constants'

const getUserByName = async (executeQuery, name) => {
  const { user } = await executeQuery(
    `query ($name: String!) {
      user(name: $name) {
        id,
        name,
        createdAt
      }
    }`,
    { name: name.trim() }
  )

  return user
}

export default {
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
    }
  },
  registerCallback: async ({ resolve, body }, username, password) => {
    const executeQuery = resolve.queryExecutors.graphql

    const existingUser = await getUserByName(executeQuery, username)

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

    return user
  },
  loginCallback: async ({ resolve, body }, username, password) => {
    const user = await getUserByName(resolve.queryExecutors.graphql, username)

    if (!user) {
      throw new Error('No such user')
    }

    return user
  },
  failureCallback: (error, redirect) => {
    redirect(`${rootDirectory}/error?text=${error}`)
  }
}
