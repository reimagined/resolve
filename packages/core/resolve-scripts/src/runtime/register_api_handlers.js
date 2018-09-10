import wrapApiHandler from 'resolve-api-handler-express'

import { app } from './server'
import { rootPath, apiHandlers } from './assemblies'
import getRootBasedUrl from './utils/get_root_based_url'

const registerApiHandlers = () => {
  for (const { path, controller } of apiHandlers) {
    const resolveApiPath = getRootBasedUrl(rootPath, `/api`)
    const executor = wrapApiHandler(controller, resolveApiPath)
    app.use(`${resolveApiPath}/${path}`, executor)
  }
}

export default registerApiHandlers
