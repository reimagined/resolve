import jwt from 'jsonwebtoken'
import { UnauthorizedError } from './errors'
import { authSecret, systemUserId } from './constants'

export const decode = (token: string) => {
  try {
    return jwt.verify(token, authSecret)
  } catch (e) {
    throw new UnauthorizedError(e.message)
  }
}

export const sign = (payload: object, options: any) => {
  return jwt.sign(payload, authSecret, options)
}

export const systemToken = () =>
  sign(
    {
      userId: systemUserId,
    },
    {}
  )
