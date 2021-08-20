import jwt from 'jsonwebtoken'
import jwtSecret from './jwt-secret'

const routeLoginCallback = async (
  { resolve }: { resolve: any },
  nickname: string
) => {
  const { data: user } = await resolve.executeQuery({
    modelName: 'user-profiles',
    resolverName: 'user',
    resolverArgs: { name: nickname.trim() },
  })

  if (!user) {
    throw new Error('Incorrect "nickname"')
  }

  return jwt.sign(user, jwtSecret)
}

export default routeLoginCallback
