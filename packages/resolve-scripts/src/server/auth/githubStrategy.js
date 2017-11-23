import { Strategy as PassportGitHubStrategy } from 'passport-github';

import { defaultFailureCallback, getRouteByName, rootDirectory } from './helper';

const strategy = (options) => {
    return {
        init: (options) => {
            const requiredOptions = { passReqToCallback: true };
            const strategyOptions = Object.assign({}, options.strategy, requiredOptions);

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

export default (options) => {
    const defaultOptions = {
        routes: {
            auth: '/auth/github',
            callback: '/auth/github/callback'
        },
        failureCallback: defaultFailureCallback
    };
    return strategy(Object.assign({}, defaultOptions, options));
};
