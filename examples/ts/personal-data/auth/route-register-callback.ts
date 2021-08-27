import jwt from 'jsonwebtoken'
import jwtSecret from './jwt-secret'
import { v4 as uuid } from 'uuid'

const routeRegisterCallback = async (params: any) => {
  const {
    resolve,
    body: { nickname, firstName, lastName, phoneNumber, address },
  } = params
  const { data: userExists } = await resolve.executeQuery({
    modelName: 'user-profiles',
    resolverName: 'exists',
    resolverArgs: { nickname: nickname.trim() },
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
    id: uuid(),
  }

  await resolve.executeCommand({
    type: 'register',
    aggregateId: user.id,
    aggregateName: 'user-profile',
    payload: user,
  })

  return jwt.sign({ nickname, userId: user.id }, jwtSecret)
}

export default routeRegisterCallback
