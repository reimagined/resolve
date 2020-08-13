import jwt from 'jsonwebtoken'
import jwtSecret from '../../auth/jwt-secret'

export default async (state, { aggregateIds, eventTypes, jwt: token }) => {
  try {
    jwt.verify(token, jwtSecret)
  } catch (error) {
    throw new Error('Permission denied')
  }

  return { state, aggregateIds, eventTypes }
}
