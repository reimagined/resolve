import serverSideRendering from './server_side_rendering'
import commandHandler from './command_handler'
import queryHandler from './query_handler'
import statusHandler from './status_handler'
import subscribeHandler from './subscribe_handler'
import getRootBasedUrl from '../utils/get_root_based_url'

const mainHandler = async (originalReq, res) => {
  const { rootPath, jwtCookie, apiHandlers } = originalReq.resolve
  const checkPath = value => {
    const baseUrl = getRootBasedUrl(rootPath, value).toLowerCase()
    return originalReq.path.toLowerCase().startsWith(baseUrl)
  }

  const req = Object.create(originalReq)
  let jwtToken = req.cookies[jwtCookie.name]

  if (req.headers && req.headers.authorization) {
    jwtToken = req.headers.authorization.replace(/^Bearer /i, '')
  }

  req.jwtToken = jwtToken

  if (jwtToken) {
    res.setHeader('Authorization', `Bearer ${jwtToken}`)
  }

  // TODO: Matching URLs one by one is very slow and inefficient
  // TODO: Use Left prefix mathing tree instead of switch/case

  for (const { method, path, controller } of apiHandlers) {
    if (
      req.method.toLowerCase() === method.toLowerCase() &&
      checkPath(`/api/${path}`)
    ) {
      return await controller(req, res)
    }
  }

  switch (true) {
    case checkPath('/api/query') && ['GET', 'POST'].includes(req.method): {
      return await queryHandler(req, res)
    }

    case checkPath('/api/status') && req.method === 'GET': {
      return await statusHandler(req, res)
    }

    case checkPath('/api/commands') && req.method === 'POST': {
      return await commandHandler(req, res)
    }

    case checkPath('/api/subscribe') && ['GET', 'POST'].includes(req.method): {
      return await subscribeHandler(req, res)
    }

    case checkPath(`/`) && req.method === 'GET': {
      return await serverSideRendering(req, res)
    }

    default: {
      await res.status(405)
      await res.end(
        `Access error: path "${
          req.path
        }" is not addressable by current executor`
      )

      resolveLog(
        'warn',
        'Path is not addressable by current executor',
        req.path,
        req
      )
      return
    }
  }
}

export default mainHandler
