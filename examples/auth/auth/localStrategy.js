import { Strategy as authStrategy } from 'passport-local'
import uuid from 'uuid'

const authStrategyParams = {
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
    return {
      name: username,
      id: uuid.v4()
    }
  },
  loginCallback: async (_, username) => {
    return {
      name: username,
      id: uuid.v4()
    }
  },
  failureCallback: (error, redirect) => {
    redirect(`/error?text=${error}`)
  }
}

export { authStrategy, authStrategyParams }
