import create from 'lodash.create'
import { failHandler } from './fail-handler'
import type { ResolveRequest, ResolveResponse } from '../types'

export const mainHandler = async (
  req: ResolveRequest,
  res: ResolveResponse
) => {
  const {
    resolve: { jwtCookie, routesTrie },
    headers,
    cookies,
    method,
    path,
  } = req

  let jwt = cookies[jwtCookie.name]
  if (headers && headers.authorization) {
    jwt = headers.authorization.replace(/^Bearer /i, '')
  }
  if (jwt) {
    res.setHeader('Authorization', `Bearer ${jwt}`)
  }

  const { node, params: matchedParams, fpr, tsr } = routesTrie.match(path)

  const modifiedRequest = create(req, {
    jwt,
    matchedParams,
  })

  if (fpr != null && fpr !== '') {
    return void (await res.redirect(fpr))
  } else if (tsr != null && tsr !== '') {
    return void (await res.redirect(tsr))
  } else if (node == null) {
    return void (await failHandler(modifiedRequest, res))
  }

  const handler = node.getHandler(method.toUpperCase())

  if (typeof handler !== 'function') {
    return void (await failHandler(modifiedRequest, res))
  }

  await handler(modifiedRequest, res)
}
