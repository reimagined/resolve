import jwt from 'jsonwebtoken'
import { UnauthorizedError } from './errors'
import { authSecret, systemUserId } from './constants'

export const decode = (token: string): any => {
  try {
    return jwt.verify(token, authSecret)
  } catch (e) {
    throw new UnauthorizedError(e.message)
  }
}

export const sign = (payload, options): string => {
  return jwt.sign(payload, authSecret, options)
}

export const systemToken = (): string =>
  sign(
    {
      userId: systemUserId
    },
    {}
  )
