import { Strategy as StrategyFactory } from 'passport-local'

const createStrategy = varyOptions => ({
  factory: StrategyFactory,
  options: {
    failureRedirect: error =>
      `/error?text=${encodeURIComponent(error.message)}`,
    errorRedirect: error => `/error?text=${encodeURIComponent(error.message)}`,
    usernameField: 'username',
    passwordField: 'username',
    successRedirect: null,
    ...varyOptions
  }
})

export default createStrategy
