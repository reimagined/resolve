import jwt from 'jsonwebtoken'
import jwtSecret from '../../auth/jwt-secret'

export default async (state, { topics, jwt: token }) => {
  const { userId } = jwt.verify(token, jwtSecret)
  // const user = await resolve.executeQuery({
  //   modelName: 'user-profiles',
  //   resolverName: 'profileById',
  //   resolverArgs: { userId },
  //   jwt: token
  // })
  //
  // if (user == null || !user) {
  //   throw new Error('Permission denied')
  // }

  return { state, topics }
}
