import jwt from 'jsonwebtoken'
import jwtSecret from './jwt_secret'

const routeLogoutCallback = async () => {
  return jwt.sign({}, jwtSecret)
}

export default routeLogoutCallback
