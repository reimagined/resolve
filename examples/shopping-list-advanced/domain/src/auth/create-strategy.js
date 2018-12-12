import { Strategy as LocalStrategyFactory } from 'passport-local'

const createStrategy = options => ({
  factory: LocalStrategyFactory,
  options: {
    failureRedirect: error =>
      `/error?text=${encodeURIComponent(error.message)}`,
    errorRedirect: error => `/error?text=${encodeURIComponent(error.message)}`,
    usernameField: 'username',
    passwordField: 'password',
    successRedirect: null,
    ...options
  }
})

export default createStrategy
