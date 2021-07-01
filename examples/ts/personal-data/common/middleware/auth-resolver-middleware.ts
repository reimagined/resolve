import { ReadModelResolverMiddleware } from '@resolve-js/core'
import { AuthResolverMiddlewareContext } from '../../types'
import { UnauthorizedError } from '../errors'
import { decode } from '../jwt'

const authMiddleware: ReadModelResolverMiddleware<AuthResolverMiddlewareContext> = (
  next
) => (middlewareContext, store, params, context) => {
  const { readModelName, resolverName } = middlewareContext
  if (
    readModelName === 'medias' ||
    (readModelName === 'user-profiles' &&
      ['profile', 'profileById', 'fullNameById'].includes(resolverName))
  ) {
    if (context.jwt) {
      const user = decode(context.jwt)
      return next(middlewareContext, store, params, { ...context, user })
    }
    throw new UnauthorizedError()
  }
  return next(middlewareContext, store, params, context)
}

export default authMiddleware
