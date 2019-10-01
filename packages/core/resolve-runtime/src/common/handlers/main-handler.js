import debugLevels from 'resolve-debug-levels'

import getRootBasedUrl from '../utils/get-root-based-url'

const log = debugLevels('resolve:resolve-runtime:main-handler')

const failExecutor = async (req, res) => {
  const errorText = `Access error: ${req.method} "${req.path}" (aka "${req.rootBasedPath}") is not addressable by current executor`
  await res.status(405)
  await res.end(errorText)
  log.warn(errorText)
}

const mainHandler = async (originalReq, res) => {
  const { rootPath, jwtCookie, routesTrie } = originalReq.resolve
  const req = Object.create(originalReq)

  let jwtToken = req.cookies[jwtCookie.name]
  if (req.headers && req.headers.authorization) {
    jwtToken = req.headers.authorization.replace(/^Bearer /i, '')
  }

  req.jwtToken = jwtToken
  if (jwtToken) {
    res.setHeader('Authorization', `Bearer ${jwtToken}`)
  }

  const baseUrl = getRootBasedUrl(rootPath, '/')
  if (!originalReq.path.startsWith(baseUrl)) {
    return void (await failExecutor(req, res))
  }

  req.rootBasedPath = originalReq.path.substr(baseUrl.length - 1)

  const { node, params, fpr, tsr } = routesTrie.match(req.rootBasedPath)

  if (fpr != null && fpr !== '') {
    return void (await res.redirect(getRootBasedUrl(rootPath, fpr)))
  } else if (tsr != null && tsr !== '') {
    return void (await res.redirect(getRootBasedUrl(rootPath, tsr)))
  } else if (node == null) {
    return void (await failExecutor(req, res))
  }

  req.matchedParams = params
  const controller = node.getHandler(req.method.toUpperCase())

  if (typeof controller !== 'function') {
    return void (await failExecutor(req, res))
  }

  await controller(req, res)
}

export default mainHandler
