import { CommandMiddleware } from '@resolve-js/core'
import { AuthCommandMiddlewareContext } from '../../types'
import { UnauthorizedError } from '../errors'
import { decode } from '../jwt'

const authMiddleware: CommandMiddleware<AuthCommandMiddlewareContext> = (
  next
) => (middlewareContext, state, command, context) => {
  if (command.aggregateName === 'user-profile' && command.type === 'register') {
    return next(middlewareContext, state, command, context)
  }
  if (context.jwt) {
    const user = decode(context.jwt)
    return next(middlewareContext, state, command, { ...context, user })
  }
  throw new UnauthorizedError()
}

export default authMiddleware
