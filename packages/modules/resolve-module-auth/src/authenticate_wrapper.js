import getRootBasedUrl from './get_root_based_url'

const authenticateWrapper = {
  success: function(jwtToken) {
    const { name: cookieName, ...cookieOptions } = this.jwtCookie
  
    this.internalRes.setHeader('x-jwt', jwtToken)
    this.internalRes.cookie(cookieName, jwtToken, cookieOptions)

    this.internalRes.redirect(
      getRootBasedUrl(this.rootPath, this.successRedirect || '/')
    )

    this.resolveAuth()
  },

  fail: function(error, status) {
    const { name: cookieName } = this.jwtCookie

    this.internalRes.clearCookie(cookieName)

    if (this.originalOptions.failureRedirect) {
      this.internalRes.redirect(
        getRootBasedUrl(
          this.rootPath,
          typeof this.originalOptions.failureRedirect === 'function'
            ? this.originalOptions.failureRedirect(error)
            : this.originalOptions.failureRedirect
        )
      )
    } else {
      this.internalRes.statusCode = error.status || status || 401
      if (error && error.message) {
        this.internalRes.error = error.message
      }
    }

    this.resolveAuth()
  },

  redirect: function(url) {
    this.internalRes.redirect(getRootBasedUrl(this.rootPath, url || '/'))

    this.resolveAuth()
  },

  pass: function() {
    this.internalRes.statusCode = 200

    this.resolveAuth()
  },

  error: function(error, status) {
    if (this.originalOptions.failureRedirect) {
      this.internalRes.redirect(
        getRootBasedUrl(
          this.rootPath,
          typeof this.originalOptions.failureRedirect === 'function'
            ? this.originalOptions.failureRedirect(error)
            : this.originalOptions.failureRedirect
        )
      )
    } else {
      this.internalRes.statusCode = error.status || status || 401
      this.internalRes.error = (error && error.message) || ''
    }

    this.resolveAuth()
  }
}

export default authenticateWrapper
