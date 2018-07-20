import jsonwebtoken from 'jsonwebtoken'

import getRootBasedUrl from './get_root_based_url'
import isObject from './is_object'

const applyJwtValue = (rootPath, jwtCookie, jwtToken, res, path) => {
  const { name: cookieName, ...cookieOptions } = jwtCookie

  if (jwtToken) {
    const jwt = jsonwebtoken.decode(jwtToken)

    if (!isObject(jwt)) {
      res.status(500).end('Incorrect JWT')
      return
    }
    res.cookie(cookieName, jwtToken, cookieOptions)
  } else {
    res.clearCookie(cookieName)
  }

  res.redirect(getRootBasedUrl(rootPath, path || '/'))
}

export default applyJwtValue
