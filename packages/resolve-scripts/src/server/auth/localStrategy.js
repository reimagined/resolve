import { Strategy as PassportLocalStrategy } from 'passport-local';

import { defaultFailureCallback, getRouteByName, rootDirectory } from './helper';

const strategy = (options) => {
    return {
        init: (options) => {
            const registerPath = getRouteByName('register', options.routes).path;
            const requiredOptions = { passReqToCallback: true };
            const strategyOptions = Object.assign({}, options.strategy, requiredOptions);

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

export default (options) => {
    const defaultOptions = {
        routes: {
            register: {
                path: '/register',
                method: 'post'
            },
            login: {
                path: '/login',
                method: 'post'
            }
        },
        failureCallback: defaultFailureCallback
    };
    return strategy(Object.assign({}, defaultOptions, options));
};
