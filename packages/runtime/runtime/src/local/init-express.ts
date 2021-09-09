import express from 'express'
import { Server } from 'http'
import path from 'path'

import wrapApiHandler from './wrap-api-handler'
import mainHandler from '../common/handlers/main-handler'
import getRootBasedUrl from '../common/utils/get-root-based-url'
import wrapTrie from '../common/wrap-trie'

import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'

import type { Resolve } from '../common/types'

const staticRouteMarkerHandler = () => {
  return
}

const initExpress = async (resolve: Resolve) => {
  const app = express()
  const server = new Server(app)

  resolve.routesTrie = wrapTrie(
    resolve.domain.apiHandlers,
    resolve.staticRoutes,
    resolve.rootPath,
    staticRouteMarkerHandler
  )
  resolve.app = app
  resolve.server = server

  if (resolve.staticPath != null && resolve.staticRoutes != null) {
    throw new Error(`Static routing failed`)
  }

  const expressStaticMiddleware = express.static(
    path.join(process.cwd(), resolve.distDir, './client')
  )

  if (resolve.staticPath != null) {
    resolve.app.use(
      getRootBasedUrl(resolve.rootPath, `/${resolve.staticPath}`),
      expressStaticMiddleware
    )
  }

  void (resolve.app as typeof app).use(async (req, res, next) => {
    if (resolve.staticRoutes != null) {
      const { node } = resolve.routesTrie.match(req.path) ?? { node: null }
      if (node != null) {
        const handler = node.getHandler(req.method.toUpperCase())
        const maybeMappedStaticFile = (resolve.staticRoutes.find(
          (route) => route[0] === node.pattern
        ) ?? [])[1]
        if (handler === staticRouteMarkerHandler) {
          return await expressStaticMiddleware(
            maybeMappedStaticFile != null
              ? Object.create(req, {
                  originalUrl: {
                    value: `/${maybeMappedStaticFile}`,
                    enumerable: true,
                  },
                  url: { value: `/${maybeMappedStaticFile}`, enumerable: true },
                  path: {
                    value: `/${maybeMappedStaticFile}`,
                    enumerable: true,
                  },
                  params: { value: {}, enumerable: true },
                  query: { value: {}, enumerable: true },
                })
              : req,
            res,
            next
          )
        }
      }
    }

    const currentResolve: Resolve = Object.create(resolve)
    try {
      await initResolve(currentResolve)

      const getCustomParameters = async () => ({ resolve: currentResolve })
      const executor = wrapApiHandler(mainHandler, getCustomParameters)

      await executor(req, res)
    } finally {
      await disposeResolve(currentResolve)
    }
  })
}

export default initExpress
