import { Strategy as PassportGoogleStrategy } from 'passport-google-oauth20'

import { defaultFailureCallback, getRouteByName, rootDirectory } from './helper'

const strategy = options => {
  return {
    init: options => {
      return new PassportGoogleStrategy(
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
        ? passport.authenticate(
            'google',
            { scope: ['profile', 'email'] },
            done
          )(req, res, next)
        : passport.authenticate('google', done)(req, res, next)
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
      auth: `${rootDirectory}/auth/google`,
      callback: `${rootDirectory}/auth/google/callback`
    },
    authCallback: ({ resolve, body }, profile, done) => {
      done(
        'Invalid option value when setting ' +
          'googleStrategy: `authCallback` should not be empty.'
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
