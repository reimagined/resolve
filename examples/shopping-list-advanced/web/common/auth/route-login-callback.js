import crypto from 'crypto'
import JWT from 'jsonwebtoken'

import jwtSecret from './jwt-secret'

const routeLoginCallback = async ({ resolve }, username, password) => {
  const user = await resolve.executeQuery({
    modelName: 'ShoppingLists',
    resolverName: 'user',
    resolverArgs: { username }
  })

  const hmac = crypto.createHmac('sha512', jwtSecret)
  hmac.update(password)

  const passwordHash = hmac.digest('hex')

  if (!user || user.passwordHash !== passwordHash) {
    throw new Error('Incorrect username or password')
  }

  return JWT.sign(user, jwtSecret)
}

export default routeLoginCallback
