import { Strategy as strategy } from 'passport-local'
import jwt from 'jsonwebtoken'
import jwtSecret from './jwtSecret'

const options = {
  strategy: {
    usernameField: 'username',
    passwordField: 'username',
    successRedirect: null
  },
  routes: {
    register: {
      path: '/register',
      method: 'POST'
    },
    logout: {
      path: '/logout',
      method: 'POST'
    }
  },
  registerCallback: async (_, username) => {
    return jwt.sign(
      {
        name: username
      },
      jwtSecret
    )
  },
  logoutCallback: async () => {
    return jwt.sign({}, jwtSecret)
  }
}

export default [{ strategy, options }]
