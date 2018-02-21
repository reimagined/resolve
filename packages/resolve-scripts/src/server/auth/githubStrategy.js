import { Strategy as PassportGitHubStrategy } from 'passport-github'

import { defaultFailureCallback, getRouteByName, rootDirectory } from './helper'
import { raiseDeprecatedWarn } from '../utils/error_handling'

const strategy = options => {
  return {
    init: options => {
      return new PassportGitHubStrategy(
        options.strategy,
        async ({ resolve, body }, accessToken, refreshToken, profile, done) => {
          try {
            done(null, await options.authCallback({ resolve, body }, profile))
          } catch (error) {
            done(error)
          }
        }
      )
    },
    middleware: (passport, options, applyJwtValue, req, res, next) => {
      const url = req.url.split('?')[0]
      const { resolve, body } = req
      const authPath = getRouteByName('auth', options.routes).path
      const redirect = location => {
        res.redirect(location)
      }
      const done = (err, user) => {
        return err
          ? options.failureCallback(err, redirect, { resolve, body })
          : applyJwtValue(user, res, options.successRedirect)
      }
      return url === authPath
        ? passport.authenticate('github')(req, res, next)
        : passport.authenticate('github', done)(req, res, next)
    },
    options
  }
}

export default options => {
  const defaultOptions = {
    strategy: {
      clientID: null,
      clientSecret: null,
      callbackURL: null,
      successRedirect: null
    },
    routes: {
      auth: `${rootDirectory}/auth/github`,
      callback: `${rootDirectory}/auth/github/callback`
    },
    authCallback: ({ resolve, body }, profile) => {
      throw new Error(
        'Invalid option value when setting ' +
          'githubStrategy: `authCallback` should not be empty.'
      )
    },
    failureCallback: defaultFailureCallback
  }
  const safeOptions = { ...defaultOptions, ...options }
  const { clientID, clientSecret, callbackURL } = safeOptions.strategy
  safeOptions.strategy = {
    clientID,
    clientSecret,
    callbackURL,
    passReqToCallback: true
  }

  return strategy(safeOptions)
}
