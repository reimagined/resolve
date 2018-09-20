import jwt from 'jsonwebtoken'
import jwtSecret from './jwt_secret'

const routeLoginCallback = async ({ resolve }, username) => {
  const user = await resolve.executeQuery({
    modelName: 'HackerNews',
    resolverName: 'user',
    resolverArgs: { name: username.trim() }
  })

  if (!user) {
    throw new Error('Incorrect "username"')
  }

  return jwt.sign(user, jwtSecret)
}

export default routeLoginCallback
