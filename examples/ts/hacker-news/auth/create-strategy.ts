import { Strategy as StrategyFactory } from 'passport-local'

const createStrategy = (options: any) => ({
  factory: StrategyFactory,
  options: {
    failureRedirect: (error: Error) =>
      `/error?text=${encodeURIComponent(error.message)}`,
    errorRedirect: (error: Error) =>
      `/error?text=${encodeURIComponent(error.message)}`,
    usernameField: 'username',
    passwordField: 'username',
    successRedirect: null,
    ...options,
  },
})

export default createStrategy
