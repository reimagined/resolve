import cookie from 'cookie'

const createRequest = expressReq => ({
  path: expressReq.path,
  method: expressReq.method,
  originalUrl: expressReq.originalUrl,
  headers: expressReq.headers,
  params: expressReq.params,
  body: expressReq.body,
  query: expressReq.query,
  cookies: expressReq.cookies,
  resolve: expressReq.resolve
})

const createResponse = expressRes => {
  const response = {
    expressRes,
    clearCookie: name => {
      const fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/ // eslint-disable-line

      if (!fieldContentRegExp.test(name)) {
        throw new TypeError('argument name is invalid')
      }

      response.cookie(name, 'deleted', {
        expires: new Date(0)
      })
    },
    cookie: (name, value, options) => {
      expressRes.append('Set-Cookie', cookie.serialize(name, value, options))
    }
  }

  return response
}

const rootPath = process.env.ROOT_PATH ? `/${process.env.ROOT_PATH}` : ''

const getRootableUrl = path => {
  if (/^https?:\/\//.test(path)) {
    throw new Error(`Absolute path not allowed: ${path}`)
  }
  return `${rootPath}/${path.replace(/^\//, '')}`
}

export { createRequest, createResponse, getRootableUrl }
