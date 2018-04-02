import { Strategy as strategy } from 'passport-local'
import jwt from 'jsonwebtoken'
import uuid from 'uuid'

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
    login: {
      path: '/login',
      method: 'POST'
    }
  },
  registerCallback: async (_, username) => {
    return jwt.sign(
      {
        name: username,
        id: uuid.v4()
      },
      'SECRETJWT'
    ) // TODO - hide jwt Secret
  },
  loginCallback: async (_, username) => {
    return jwt.sign(
      {
        name: username,
        id: uuid.v4()
      },
      'SECRETJWT'
    ) // TODO - hide jwt Secret
  },
  failureCallback: (error, redirect) => {
    // eslint-disable-next-line no-console
    console.log(error)
    redirect(`/`)
  }
}

export default [{ strategy, options }]
