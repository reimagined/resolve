const createStrategyWrapper = (
  strategy,
  req,
  res,
  options,
  { jwtCookie, rootPath, getRootBasedUrl }
) => {
  // const wrapper = Object.create(Object.getPrototypeOf(strategy))
  //
  // for (const key of Reflect.ownKeys(strategy)) {
  //   const descriptor = Object.getOwnPropertyDescriptor(strategy, key)
  //
  //   Object.defineProperty(wrapper, key, descriptor)
  // }
  const wrapper = strategy
  
  Object.assign(wrapper, {
    success: (jwtToken) => {
      console.log('success', jwtToken)
    
      const { name: cookieName, ...cookieOptions } = jwtCookie
    
      res.cookie(cookieName, jwtToken, cookieOptions)
      res.setHeader('Authorization', `Bearer ${jwtToken}`)
    
      res.redirect(getRootBasedUrl(rootPath, options.successRedirect || '/'))
    },
  
    fail: (error, status) => {
      console.log('fail', error, status)
    
      const { name: cookieName } = jwtCookie
    
      res.clearCookie(cookieName)
    
      if (options.failureRedirect) {
        res.redirect(
          getRootBasedUrl(
            rootPath,
            typeof options.failureRedirect === 'function'
              ? options.failureRedirect(error)
              : options.failureRedirect
          )
        )
      } else {
        res.statusCode = error.status || status || 401
        if (error && error.message) {
          res.error = error.message
        }
      }
    },
  
    redirect: (url) => {
      console.log('url', url)
    
      res.redirect(  getRootBasedUrl(rootPath, url || '/'))
    },
  
    pass: () => {
      console.log('pass', url)
    
      res.statusCode = 200
    },
  
    error: (error, status) => {
      console.log('error', error, status)
    
      if (options.errorRedirect) {
        res.redirect(
          getRootBasedUrl(
            rootPath,
            typeof options.errorRedirect === 'function'
              ? options.errorRedirect(error)
              : options.errorRedirect
          )
        )
      } else {
        res.statusCode = error.status || status || 401
        res.error = (error && error.message) || ''
      }
    }
  })
  
  return wrapper
}

export default createStrategyWrapper
