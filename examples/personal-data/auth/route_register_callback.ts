import jwt from 'jsonwebtoken'
import jwtSecret from './jwt_secret'
import uuid from 'uuid/v4'

const routeRegisterCallback = async params => {
  const {
    resolve,
    body: { nickname, firstName, lastName, phoneNumber, address }
  } = params
  const userExists = await resolve.executeQuery({
    modelName: 'user-profiles',
    resolverName: 'exists',
    resolverArgs: { nickname: nickname.trim() }
  })

  if (userExists) {
    throw new Error('User cannot be created')
  }

  const user = {
    nickname,
    firstName,
    lastName,
    phoneNumber,
    address,
    id: uuid()
  }

  await resolve.executeCommand({
    type: 'register',
    aggregateId: uuid(),
    aggregateName: 'user-profile',
    payload: user
  })

  const token = jwt.sign({ nickname, userId: user.id }, jwtSecret)
  return token
}

export default routeRegisterCallback
