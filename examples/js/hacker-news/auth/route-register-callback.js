import jwt from 'jsonwebtoken'
import jwtSecret from './jwt-secret'
import { v4 as uuid } from 'uuid'
const routeRegisterCallback = async ({ resolve }, username) => {
  const { data: existingUser } = await resolve.executeQuery({
    modelName: 'HackerNews',
    resolverName: 'user',
    resolverArgs: { name: username.trim() },
  })
  if (existingUser) {
    throw new Error('User cannot be created')
  }
  const user = {
    name: username.trim(),
    id: uuid(),
  }
  await resolve.executeCommand({
    type: 'createUser',
    aggregateId: user.id,
    aggregateName: 'User',
    payload: user,
  })
  return jwt.sign(user, jwtSecret)
}
export default routeRegisterCallback
