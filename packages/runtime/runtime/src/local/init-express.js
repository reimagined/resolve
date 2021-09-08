import mime from 'mime-types'
import http from 'http'
import path from 'path'
import fs from 'fs'
import { URL } from 'url'

import wrapApiHandler from './wrap-api-handler'
import mainHandler from '../common/handlers/main-handler'
import getRootBasedUrl from '../common/utils/get-root-based-url'
import wrapTrie from '../common/wrap-trie'

import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'

const serveStaticFile = async (staticFilePath, res) => {
  res.setHeader('Content-Type', mime.lookup(staticFilePath))
  fs.createReadStream(staticFilePath).pipe(res)
}

const initExpress = async (resolve) => {
  const server = http.createServer(async (inputReq, res) => {
    const { protocol, host, port, pathname, searchParams } = new URL(
      inputReq.url,
      `http://${inputReq.headers.host}`
    )
    const req = Object.assign(Object.create(inputReq), {
      query: [...searchParams].reduce(
        (acc, [key, value]) => Object.assign(acc, { [key]: value }),
        {}
      ),
      path: pathname,
      protocol,
      host,
      port,
    })
    let staticFile = null
    const { node } = resolve.routesTrie.match(req.path) ?? { node: null }
    if (node != null) {
      const handler = node.getHandler(req.method.toUpperCase())
      const maybeMappedStaticFile = (resolve.staticRoutes?.find(
        (route) => route[0] === node.pattern
      ) ?? [])[1]
      const staticPrefixLength = (resolve.staticPath != null
        ? getRootBasedUrl(resolve.rootPath, `/${resolve.staticPath}`)
        : getRootBasedUrl(resolve.rootPath, `/`)
      ).length

      staticFile =
        handler == serveStaticFile
          ? maybeMappedStaticFile == null
            ? req.path.substring(staticPrefixLength)
            : maybeMappedStaticFile
          : null
    }
    if (staticFile != null) {
      const staticFilePath = path.join(
        process.cwd(),
        resolve.distDir,
        'client',
        staticFile
      )
      return await serveStaticFile(staticFilePath, res)
    }

    const currentResolve = Object.create(resolve)
    try {
      await initResolve(currentResolve)

      const getCustomParameters = async () => ({ resolve: currentResolve })
      const executor = wrapApiHandler(mainHandler, getCustomParameters)

      await executor(req, res)
    } finally {
      await disposeResolve(currentResolve)
    }
  })

  if (resolve.staticPath != null && resolve.staticRoutes != null) {
    throw new Error(`Static routing failed`)
  }

  Object.defineProperties(resolve, {
    routesTrie: {
      value: wrapTrie(
        resolve.domain.apiHandlers,
        resolve.staticRoutes == null
          ? [
              [getRootBasedUrl(resolve.staticPath, '/')],
              [getRootBasedUrl(resolve.staticPath, '/:static*')],
            ]
          : resolve.staticRoutes,
        resolve.rootPath,
        serveStaticFile
      ),
      enumerable: true,
    },
    server: { value: server },
  })
}

export default initExpress
