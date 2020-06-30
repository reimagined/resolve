import failHandler from './fail-handler'

const mainHandler = async (originalReq, res) => {
  const { jwtCookie, routesTrie } = originalReq.resolve
  const req = Object.create(originalReq)

  let jwtToken = req.cookies[jwtCookie.name]
  if (req.headers && req.headers.authorization) {
    jwtToken = req.headers.authorization.replace(/^Bearer /i, '')
  }
  req.jwtToken = jwtToken
  if (jwtToken) {
    res.setHeader('Authorization', `Bearer ${jwtToken}`)
  }

  const { node, params, fpr, tsr } = routesTrie.match(req.path)

  if (fpr != null && fpr !== '') {
    return void (await res.redirect(fpr))
  } else if (tsr != null && tsr !== '') {
    return void (await res.redirect(tsr))
  } else if (node == null) {
    return void (await failHandler(req, res))
  }

  req.matchedParams = params
  const handler = node.getHandler(req.method.toUpperCase())

  if (typeof handler !== 'function') {
    return void (await failHandler(req, res))
  }

  await handler(req, res)
}

export default mainHandler
