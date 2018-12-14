const sendAuthResponse = async (authResponse, res, rootPath, noredirect) => {
  for (const key of Object.keys(authResponse.headers)) {
    res.setHeader(key, authResponse.headers[key])
  }
  for (const key of Object.keys(authResponse.cookies)) {
    res.cookie(key, authResponse.cookies[key].value, {
      ...authResponse.cookies[key].options,
      path: `/${rootPath}`
    })
  }

  if (noredirect) {
    res.status(200)
    res.end(JSON.stringify(authResponse))
    return
  }

  res.status(authResponse.statusCode)
  if (authResponse.headers.Location) {
    res.redirect(authResponse.headers.Location, authResponse.statusCode)
  } else {
    res.end(String(authResponse.error))
  }
}

export default sendAuthResponse
