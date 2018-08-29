const createResponse = () => {
  const response = {
    statusCode: 200,
    headers: {},
    cookies: {},
    cookie: (name, value, options) => {
      response.cookies[name] = { name, value, options }
    },
    clearCookie: name => {
      response.cookies[name] = {
        name,
        value: 'deleted',
        options: { expires: new Date(0) }
      }
    },
    redirect: (...args) => {
      let status, path
      if (args.length === 1) {
        status = 302
        path = args[0]
      } else {
        status = args[0] || 302
        path = args[1]
      }
      response.statusCode = status
      response.headers.Location = path
    },
    setHeader: (name, value) => {
      response.headers[name] = value
    }
  }
  return response
}

export default createResponse
