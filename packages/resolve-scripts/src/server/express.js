import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import jwt from 'jsonwebtoken';
import path from 'path';
import { createReadModel, createViewModel, createFacade } from 'resolve-query';
import commandHandler from 'resolve-command';
import request from 'request';
import passport from 'passport';

import { raiseError } from './utils/error_handling.js';
import eventStore from './event_store';
import ssr from './render';

import config from '../configs/server.config.js';
import message from './message';

const STATIC_PATH = '/static';
const rootDirectory = process.env.ROOT_DIR || '';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

if (!Array.isArray(config.readModels)) {
    raiseError(message.readModelsArrayFormat, config.readModels);
}

if (!Array.isArray(config.viewModels)) {
    raiseError(message.viewModelsArrayFormat, config.viewModels);
}

const queryExecutors = {};

config.readModels.forEach((readModel) => {
    if (!readModel.name && config.readModels.length === 1) {
        readModel.name = 'graphql';
    } else if (!readModel.name) {
        raiseError(message.readModelMandatoryName, readModel);
    } else if (queryExecutors[readModel.name]) {
        raiseError(message.dublicateName, readModel);
    }

    if (!readModel.gqlSchema || !readModel.gqlResolvers) {
        raiseError(message.readModelQuerySideMandatory, readModel);
    }

    queryExecutors[readModel.name] = createFacade({
        model: createReadModel({
            projection: readModel.projection,
            adapter: readModel.adapter,
            eventStore
        }),
        gqlSchema: readModel.gqlSchema,
        gqlResolvers: readModel.gqlResolvers
    }).executeQueryGraphql;

    queryExecutors[readModel.name].mode = 'graphql';
});

config.viewModels.forEach((viewModel) => {
    if (!viewModel.name && config.viewModels.length === 1) {
        viewModel.name = 'reduxinitial';
    } else if (!viewModel.name) {
        raiseError(message.viewModelMandatoryName, viewModel);
    } else if (queryExecutors[viewModel.name]) {
        raiseError(message.dublicateName, viewModel);
    }

    if (!viewModel.serializeState || !viewModel.deserializeState) {
        raiseError(message.viewModelSerializable, viewModel);
    }

    queryExecutors[viewModel.name] = createFacade({
        model: createViewModel({
            projection: viewModel.projection,
            eventStore
        }),
        customResolvers: {
            view: async (model, aggregateIds) =>
                await viewModel.serializeState(await model(aggregateIds))
        }
    }).executeQueryCustom.bind(null, 'view');

    queryExecutors[viewModel.name].mode = 'view';
});

const executeCommand = commandHandler({
    eventStore,
    aggregates: config.aggregates
});

app.use((req, res, next) => {
    req.getJwt = jwt.verify.bind(
        null,
        req.cookies && req.cookies[config.jwt.cookieName],
        config.jwt.secret,
        config.jwt.options
    );

    req.resolve = {
        queryExecutors,
        executeCommand,
        eventStore
    };

    next();
});

const applyJwtValue = (value, res, url) => {
    const authenticationToken = jwt.sign(value, config.jwt.secret);
    res.cookie(config.jwt.cookieName, authenticationToken, config.jwt.options);
    res.redirect(url || `${rootDirectory}/`);
};

const bindAuthMiddleware = (route, method, middleware, options) => {
    app[method](route, (req, res, next) =>
        middleware(passport, options, applyJwtValue, req, res, next)
    );
};

const getRouteByName = (name, routes) => {
    const route = routes[name];
    const { path = route, method = 'get' } = route;
    if (typeof path !== 'string') return null;
    return { path, method };
};

config.auth.strategies.forEach((strategy) => {
    const options = strategy.options;
    passport.use(strategy.init(options));
    const routes = options.routes;
    Object.keys(routes).forEach((key) => {
        const route = getRouteByName(key, routes);
        bindAuthMiddleware(route.path, route.method, strategy.middleware, options);
    });
});

app.use(passport.initialize());

try {
    config.extendExpress(app);
} catch (err) {}

app.post(`${rootDirectory}/api/commands`, async (req, res) => {
    try {
        await executeCommand(req.body, req.jwt);
        res.status(200).send(message.commandSuccess);
    } catch (err) {
        res.status(500).end(`${message.commandFail}${err.message}`);
        // eslint-disable-next-line no-console
        console.log(err);
    }
});

Object.keys(queryExecutors).forEach((modelName) => {
    const executor = queryExecutors[modelName];
    if (executor.mode === 'graphql') {
        app.post(
            `${rootDirectory}/api/query/${modelName}`,
            bodyParser.urlencoded({ extended: false }),
            async (req, res) => {
                try {
                    const data = await executor(
                        req.body.query,
                        req.body.variables || {},
                        req.getJwt
                    );
                    res.status(200).send({ data });
                } catch (err) {
                    res.status(500).end(`${message.readModelFail}${err.message}`);
                    // eslint-disable-next-line no-console
                    console.log(err);
                }
            }
        );
    } else if (executor.mode === 'view') {
        app.get(`${rootDirectory}/api/query/${modelName}`, async (req, res) => {
            try {
                const aggregateIds = req.query.aggregateIds;
                if (
                    aggregateIds !== '*' &&
                    (!Array.isArray(aggregateIds) || aggregateIds.length === 0)
                ) {
                    throw new Error(message.viewModelOnlyOnDemand);
                }

                const result = await executor(req.query.aggregateIds);
                res.status(200).json(result);
            } catch (err) {
                res.status(500).end(`${message.viewModelFail}${err.message}`);
                // eslint-disable-next-line no-console
                console.log(err);
            }
        });
    }
});

const staticMiddleware =
    process.env.NODE_ENV === 'production'
        ? express.static(path.join(process.cwd(), './dist/static'))
        : (req, res) => {
            const newurl = 'http://localhost:3001' + req.path;
            request(newurl).pipe(res);
        };

app.use(`${rootDirectory}${STATIC_PATH}`, staticMiddleware);

app.get([`${rootDirectory}/*`, `${rootDirectory || '/'}`], async (req, res) => {
    try {
        const state = await config.initialState(queryExecutors, {
            cookies: req.cookies,
            hostname: req.hostname,
            originalUrl: req.originalUrl,
            body: req.body,
            query: req.query
        });

        ssr(state, { req, res });
    } catch (err) {
        res.status(500).end(`${message.ssrError}${err.message}`);
        // eslint-disable-next-line no-console
        console.log(err);
    }
});

export default app;
