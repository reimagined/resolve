import { Strategy as LocalStrategyFactory } from 'passport-local'

const createStrategy = varyOptions => ({
  factory: LocalStrategyFactory,
  options: {
    failureRedirect: error =>
      `/error?text=${encodeURIComponent(error.message)}`,
    errorRedirect: error => `/error?text=${encodeURIComponent(error.message)}`,
    usernameField: 'username',
    passwordField: 'password',
    successRedirect: null,
    ...varyOptions
  }
})

export default createStrategy
