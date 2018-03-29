import uuid from 'uuid'

/* eslint-disable */

import { rootDirectory } from '../client/constants'

const getUserByName = async (executeQuery, name) => {
  const { user } = await executeQuery('user', { name: name.trim() })
  return user
}

export default {
  strategy: {
    usernameField: 'username',
    passwordField: 'username',
    successRedirect: null
  },
  registerCallback: async ({ resolve, body }, username, password) => {
    const existingUser = await getUserByName(
      resolve.queryExecutors.default,
      username
    )

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
    const user = await getUserByName(resolve.queryExecutors.default, username)

    if (!user) {
      throw new Error('No such user')
    }

    return user
  },
  failureCallback: (error, redirect) => {
    redirect(`${rootDirectory}/error?text=${error}`)
  }
}
/* eslint-enable */
