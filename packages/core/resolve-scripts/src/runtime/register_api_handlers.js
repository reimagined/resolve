import wrapApiHandler from 'resolve-api-handler-express'

import { app } from './server'
import * as assemblies from './assemblies'
import getRootBasedUrl from './utils/get_root_based_url'

const { rootPath, apiHandlers, constants } = assemblies

const getCustomParameters = async () => ({ resolve: constants })

const registerApiHandlers = () => {
  for (const { path, method, controller } of apiHandlers) {
    const handlerPath = getRootBasedUrl(rootPath, `/api/${path}`)
    const executor = wrapApiHandler(controller, getCustomParameters)
    app[method.toLowerCase()](handlerPath, executor)
  }
}

export default registerApiHandlers
