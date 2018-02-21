import { Strategy as PassportLocalStrategy } from 'passport-local'

import { defaultFailureCallback, getRouteByName, rootDirectory } from './helper'

const strategy = options => {
  return {
    init: options => {
      const registerPath = getRouteByName('register', options.routes).path
      return new PassportLocalStrategy(
        options.strategy,
        async (req, username, password, done) => {
          const url = req.url.split('?')[0]
          const { resolve, body } = req
          try {
            const value =
              url === registerPath
                ? await options.registerCallback(
                    { resolve, body },
                    username,
                    password
                  )
                : await options.loginCallback(
                    { resolve, body },
                    username,
                    password
                  )
            done(null, value)
          } catch (error) {
            done(error)
          }
        }
      )
    },
    middleware: (passport, options, applyJwtValue, req, res, next) => {
      const { resolve, body } = req
      const redirect = location => {
        res.redirect(location)
      }
      const done = (err, user) => {
        return err
          ? options.failureCallback(err, redirect, { resolve, body })
          : applyJwtValue(user, res, options.successRedirect)
      }
      passport.authenticate('local', done)(req, res, next)
    },
    options
  }
}

export default options => {
  const defaultOptions = {
    strategy: {
      usernameField: 'username',
      passwordField: 'password',
      successRedirect: null
    },
    routes: {
      register: {
        path: `${rootDirectory}/register`,
        method: 'post'
      },
      login: {
        path: `${rootDirectory}/login`,
        method: 'post'
      }
    },
    registerCallback: ({ resolve, body }, username, password, done) => {
      done(
        'Invalid option value when setting ' +
          'localStrategy: `registerCallback` should not be empty.'
      )
    },
    loginCallback: ({ resolve, body }, username, password, done) => {
      done(
        'Invalid option value when setting ' +
          'localStrategy: `loginCallback` should not be empty.'
      )
    },
    failureCallback: defaultFailureCallback
  }

  const safeOptions = { ...defaultOptions, ...options }
  const { usernameField, passwordField } = safeOptions.strategy
  safeOptions.strategy = {
    usernameField,
    passwordField,
    passReqToCallback: true
  }

  return strategy(safeOptions)
}
