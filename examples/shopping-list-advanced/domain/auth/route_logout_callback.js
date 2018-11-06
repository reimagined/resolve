import JWT from 'jsonwebtoken'

import jwtSecret from './jwt_secret'

const routeLogoutCallback = async () => {
  return JWT.sign({}, jwtSecret)
}

export default routeLogoutCallback
