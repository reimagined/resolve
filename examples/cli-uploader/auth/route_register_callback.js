import jwt from 'jsonwebtoken'
import jwtSecret from '../common/jwt_secret'
import uuid from 'uuid/v4'
import md5 from 'md5'

const routeRegisterCallback = async ({ resolve }, login, password) => {
  const existingUser = await resolve.executeQuery({
    modelName: 'Users',
    resolverName: 'user',
    resolverArgs: { login: login.trim() }
  })

  if (existingUser) {
    throw new Error('User cannot be created')
  }

  const user = {
    login: login.trim(),
    passwordHash: md5(password)
  }

  const token = jwt.sign(user, jwtSecret)

  await resolve.executeCommand({
    type: 'createUser',
    aggregateId: uuid(),
    aggregateName: 'User',
    payload: user,
    jwt
  })

  return token
}

export default routeRegisterCallback
