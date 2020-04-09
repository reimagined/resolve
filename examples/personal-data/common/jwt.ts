import jwt from 'jsonwebtoken'
import { UnauthorizedError } from './errors'

const secret = '*SECRET*'

export const decode = (token: string): any => {
  try {
    return jwt.verify(token, secret)
  } catch (e) {
    throw new UnauthorizedError(e.message)
  }
}

/*
export const sign = (payload, options): string => {
  return jwt.sign(payload, secret, options)
}
*/
