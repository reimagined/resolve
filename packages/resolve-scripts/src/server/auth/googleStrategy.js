import { Strategy as PassportGoogleStrategy } from 'passport-google-oauth20';

import { defaultFailureCallback, getRouteByName, rootDirectory } from './helper';

const strategy = (options) => {
    return {
        init: (options) => {
            const requiredOptions = { passReqToCallback: true };
            const strategyOptions = Object.assign({}, options.strategy, requiredOptions);

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

export default (options) => {
    const defaultOptions = {
        routes: {
            auth: '/auth/google',
            callback: '/auth/google/callback'
        },
        failureCallback: defaultFailureCallback
    };
    return strategy(Object.assign({}, defaultOptions, options));
};
