import { Strategy as strategy } from 'passport-local'
import jwt from 'jsonwebtoken'

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
      process.env.JWT_SECRET || 'SECRETJWT'
    )
  },
  logoutCallback: async () => {
    return jwt.sign({}, process.env.JWT_SECRET || 'SECRETJWT')
  }
}

export default [{ strategy, options }]
