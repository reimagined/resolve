import { Strategy as PassportGitHubStrategy } from 'passport-github';

import { defaultFailureCallback, getRouteByName, rootDirectory } from './helper';

const strategy = (options) => {
    return {
        init: (options) => {
            return new PassportGitHubStrategy(
                options.strategy,
                ({ resolve, body }, accessToken, refreshToken, profile, done) =>
                    options.authCallback({ resolve, body }, profile, done)
            );
        },
        middleware: (passport, options, applyJwtValue, req, res, next) => {
            const url = req.url.split('?')[0];
            const { resolve, body } = req;
            const authPath = getRouteByName('auth', options.routes).path;
            const redirect = (location) => {
                res.redirect(location);
            };
            const done = (err, user) => {
                return err
                    ? options.failureCallback(err, redirect, { resolve, body })
                    : applyJwtValue(user, res, options.successRedirect);
            };
            return url === `${rootDirectory}${authPath}`
                ? passport.authenticate('github')(req, res, next)
                : passport.authenticate('github', done)(req, res, next);
        },
        options
    };
};

export default (options) => {
    const defaultOptions = {
        strategy: {
            clientID: null,
            clientSecret: null,
            callbackURL: null
        },
        routes: {
            auth: '/auth/github',
            callback: '/auth/github/callback'
        },
        failureCallback: defaultFailureCallback
    };
    const safeOptions = Object.assign({}, defaultOptions, options);
    const { clientID, clientSecret, callbackURL } = safeOptions.strategy;
    safeOptions.strategy = { clientID, clientSecret, callbackURL, passReqToCallback: true };

    return strategy(safeOptions);
};
