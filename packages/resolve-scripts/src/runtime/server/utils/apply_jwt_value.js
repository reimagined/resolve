import jsonwebtoken from 'jsonwebtoken'

import getRootBasedUrl from './get_root_based_url'
import isObject from './is_object'

const jwtCookie = $resolve.jwtCookie

const applyJwtValue = (jwtToken, res, url) => {
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

  res.redirect(url || getRootBasedUrl('/'))
}

export default applyJwtValue
