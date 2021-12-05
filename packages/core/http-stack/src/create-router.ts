import Trie from 'route-trie'

import type { HttpRequest, HttpResponse, RouterOptions } from './types'
import defaultNotFoundHandler from './default-not-found-handler'
import createCorsMiddleware from './create-cors-middleware'
import corsHandler from './cors-handler'
import createRouteMatcher from './create-route-matcher'

const createRouter = <
  CustomParameters extends Record<string | symbol, any> = {}
>({
  cors = {},
  options = {
    ignoreCase: true,
    fixedPathRedirect: true,
    trailingSlashRedirect: true,
  },
  routes,
  notFoundHandler = defaultNotFoundHandler,
}: RouterOptions<CustomParameters>) => {
  const trie = new Trie(options)

  const corsMiddleware = createCorsMiddleware(cors)
  for (const route of routes) {
    if (corsMiddleware != null) {
      route.middlewares = [corsMiddleware, ...route.middlewares]
    }
  }

  for (const { method, pattern, middlewares, handler } of routes) {
    trie.define(pattern).handle(
      method,
      async (
        req: HttpRequest<CustomParameters>,
        res: HttpResponse
      ): Promise<void> => {
        let isNext = false
        const next = () => {
          isNext = true
        }

        for (const middleware of middlewares) {
          isNext = false
          await middleware(req, res, next)
          if (!isNext) {
            return
          }
        }
        await handler(req, res)
      }
    )
  }
  for (const { pattern } of routes) {
    try {
      if (corsMiddleware != null) {
        trie.define(pattern).handle(
          'OPTIONS',
          async (
            req: HttpRequest<CustomParameters>,
            res: HttpResponse
          ): Promise<void> => {
            await corsMiddleware(req, res, Function() as any)
            await corsHandler(req, res)
          }
        )
      }
    } catch {}
  }

  return createRouteMatcher(trie, notFoundHandler)
}

export default createRouter
