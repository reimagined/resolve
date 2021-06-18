import jwt from 'jsonwebtoken'
import jwtSecret from './jwt-secret'
const API_GATEWAY_TIMEOUT = 30000
const routeLoginCallback = async ({ resolve }, username) => {
  const startTimestamp = Date.now()
  while (true) {
    try {
      const { data: user } = await resolve.executeQuery({
        modelName: 'HackerNews',
        resolverName: 'user',
        resolverArgs: { name: username.trim() },
      })
      if (!user) {
        throw new Error('Incorrect "username"')
      }
      return jwt.sign(user, jwtSecret)
    } catch (error) {
      if (Date.now() - startTimestamp > API_GATEWAY_TIMEOUT) {
        throw error
      }
    }
  }
}
export default routeLoginCallback
