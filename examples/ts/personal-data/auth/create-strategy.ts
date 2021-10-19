import { Strategy as StrategyFactory, IStrategyOptions } from 'passport-local'

const createStrategy = (options: IStrategyOptions): any => ({
  factory: StrategyFactory,
  options: {
    failureRedirect: (error: Error) =>
      `/error?text=${encodeURIComponent(error.message)}`,
    errorRedirect: (error: Error) =>
      `/error?text=${encodeURIComponent(error.message)}`,
    usernameField: 'nickname',
    passwordField: 'nickname',
    successRedirect: null,
    ...options,
  },
})

export default createStrategy
