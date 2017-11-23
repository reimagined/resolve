import { Strategy as PassportLocalStrategy } from 'passport-local';
import { Strategy as PassportGitHubStrategy } from 'passport-github';
import { Strategy as PassportGoogleStrategy } from 'passport-google-oauth20';

const rootDirectory = process.env.ROOT_DIR || '';

export const getRouteByName = (name, routes) => {
    const route = routes[name];
    const { path = route, method = 'get' } = route;
    if (typeof path !== 'string') return null;
    return { path, method };
};

export const localStrategy = (options) => {
    return {
        init: (options) => {
            const registerPath = getRouteByName('register', options.routes).path;
            const requiredOptions = { passReqToCallback: true };
            const strategyOptions = Object.assign(options.strategy, requiredOptions);

            return new PassportLocalStrategy(strategyOptions, (req, username, password, done) => {
                const url = req.url.split('?')[0];
                if (url === `${rootDirectory}${registerPath}`) {
                    options.registerCallback(req, username, password, done);
                } else {
                    options.loginCallback(req, username, password, done);
                }
            });
        },
        middleware: (passport, options, applyJwtValue, req, res, next) => {
            const done = (err, user) => {
                return err
                    ? options.failureCallback(err, req, res, next)
                    : applyJwtValue(user, res, options.successRedirect);
            };
            passport.authenticate('local', done)(req, res, next);
        },
        options
    };
};

export const githubStrategy = (options) => {
    return {
        init: (options) => {
            const requiredOptions = { passReqToCallback: true };
            const strategyOptions = Object.assign(options.strategy, requiredOptions);

            return new PassportGitHubStrategy(
                strategyOptions,
                (req, accessToken, refreshToken, profile, done) =>
                    options.authCallback(req, profile, done)
            );
        },
        middleware: (passport, options, applyJwtValue, req, res, next) => {
            const done = (err, user) => {
                return err
                    ? options.failureCallback(err, req, res, next)
                    : applyJwtValue(user, res, options.successRedirect);
            };
            const url = req.url.split('?')[0];
            const authPath = getRouteByName('auth', options.routes).path;
            return url === `${rootDirectory}${authPath}`
                ? passport.authenticate('github')(req, res, next)
                : passport.authenticate('github', done)(req, res, next);
        },
        options
    };
};

export const googleStrategy = (options) => {
    return {
        init: (options) => {
            const requiredOptions = { passReqToCallback: true };
            const strategyOptions = Object.assign(options.strategy, requiredOptions);

            return new PassportGoogleStrategy(
                strategyOptions,
                (req, accessToken, refreshToken, profile, done) =>
                    options.authCallback(req, profile, done)
            );
        },
        middleware: (passport, options, applyJwtValue, req, res, next) => {
            const done = (err, user) => {
                return err
                    ? options.failureCallback(err, req, res, next)
                    : applyJwtValue(user, res, options.successRedirect);
            };
            const url = req.url.split('?')[0];
            const authPath = getRouteByName('auth', options.routes).path;
            return url === `${rootDirectory}${authPath}`
                ? passport.authenticate('google', { scope: ['profile', 'email'] }, done)(
                      req,
                      res,
                      next
                  )
                : passport.authenticate('google', done)(req, res, next);
        },
        options
    };
};
