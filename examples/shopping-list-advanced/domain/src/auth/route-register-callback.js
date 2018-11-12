import uuid from 'uuid/v4'
import crypto from 'crypto'
import JWT from 'jsonwebtoken'

import jwtSecret from './jwt-secret'

const ROOT_JWT_TOKEN = JWT.sign(
  {
    username: 'root',
    id: '00000000-0000-0000-0000-000000000000',
    role: 'root'
  },
  jwtSecret
)

const routeRegisterCallback = async ({ resolve }, username, password) => {
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

export default routeRegisterCallback
