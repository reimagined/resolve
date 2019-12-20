import jwt from 'jsonwebtoken'
import jwtSecret from '../common/jwt_secret'
import md5 from 'md5'

const routeLoginCallback = async ({ resolve }, login, password) => {
  const passwordHash = md5(password)
  const user = await resolve.executeQuery({
    modelName: 'Users',
    resolverName: 'user',
    resolverArgs: { login: login.trim() }
  })

  if (user.login !== login || user.passwordHash !== passwordHash) {
    throw new Error('Incorrect login or password')
  }

  return jwt.sign(user, jwtSecret)
}

export default routeLoginCallback
