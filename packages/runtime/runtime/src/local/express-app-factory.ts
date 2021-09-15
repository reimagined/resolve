import * as path from 'path'
import * as http from 'http'
import express, { Express } from 'express'
import { getRootBasedUrl } from '@resolve-js/core'
import wrapTrie from '../common/wrap-trie'
import type { ApiHandler } from '../common/types'
import { Trie } from 'route-trie'

type ExpressAppFactoryParameters = {
  apiHandlers: ApiHandler[]
  staticRoutes: string[] | undefined
  rootPath: string
  staticPath: string
  distDir: string
}

export type ExpressAppData = {
  app: Express
  server: http.Server
  expressStaticMiddleware: ReturnType<typeof express.static>
  staticRouteMarkerHandler: Function
  routesTrie: Trie
  staticRoutes: string[] | undefined
}

const staticRouteMarkerHandler = () => {
  return
}

export const expressAppFactory = async (
  params: ExpressAppFactoryParameters
): Promise<ExpressAppData> => {
  const { apiHandlers, staticRoutes, rootPath, staticPath, distDir } = params

  const app = express()
  const server = new http.Server(app)

  const routesTrie = wrapTrie(
    apiHandlers,
    staticRoutes,
    rootPath,
    staticRouteMarkerHandler
  )

  if (staticPath != null && staticRoutes != null) {
    throw new Error(`Static routing failed`)
  }

  const expressStaticMiddleware = express.static(
    path.join(process.cwd(), distDir, './client')
  )

  if (staticPath != null) {
    app.use(
      getRootBasedUrl(rootPath, `/${staticPath}`),
      expressStaticMiddleware
    )
  }

  return {
    app,
    server,
    expressStaticMiddleware,
    staticRouteMarkerHandler,
    routesTrie,
    staticRoutes,
  }
}
