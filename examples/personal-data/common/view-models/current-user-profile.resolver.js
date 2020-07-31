import jwt from 'jsonwebtoken'
import jwtSecret from '../../auth/jwt-secret'

export default async (resolve, { topics, jwt: token }) => {
  const { userId } = jwt.verify(token, jwtSecret)
  let user = null
  try {
    user = await resolve.executeQuery({
      modelName: 'user-profiles',
      resolverName: 'profileById',
      resolverArgs: { userId },
      jwtToken: token
    })
  } catch (error) {
    console.log('currentUserProfileResolver ERROR', error)
  }

  if (user == null || !user) {
    throw new Error('Permission denied')
  }

  return topics
}
