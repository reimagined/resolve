import express from 'express'
import { Server } from 'http'
import path from 'path'

import wrapApiHandler from 'resolve-api-handler-express'
import mainHandler from '../common/handlers/main-handler'
import getRootBasedUrl from '../common/utils/get-root-based-url'

import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'

const initExpress = async resolve => {
  const app = express()
  const server = new Server(app)

  Object.defineProperties(resolve, {
    app: { value: app },
    server: { value: server }
  })

  resolve.app.use(
    getRootBasedUrl(resolve.rootPath, `/${resolve.staticPath}`),
    express.static(path.join(process.cwd(), resolve.distDir, './client'))
  )

  resolve.app.use(async (req, res) => {
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
}

export default initExpress
