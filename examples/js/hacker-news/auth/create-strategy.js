import { Strategy as StrategyFactory } from 'passport-local'
const createStrategy = (options) => ({
  factory: StrategyFactory,
  options: {
    failureRedirect: (error) =>
      `/error?text=${encodeURIComponent(error.message)}`,
    errorRedirect: (error) =>
      `/error?text=${encodeURIComponent(error.message)}`,
    usernameField: 'username',
    passwordField: 'username',
    successRedirect: null,
    ...options,
  },
})
export default createStrategy
