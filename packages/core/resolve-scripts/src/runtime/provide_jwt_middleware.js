import { jwtCookie } from './assemblies'

const provideJwtMiddleware = (req, res, next) => {
  let jwtToken = req.cookies[jwtCookie.name]

  if (req.headers && req.headers.authorization) {
    jwtToken = req.headers.authorization.replace(/^Bearer /i, '')
  }

  req.jwtToken = jwtToken

  res.setHeader('Authorization', `Bearer ${jwtToken}`)

  next()
}

export default provideJwtMiddleware
