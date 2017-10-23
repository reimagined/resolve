import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import jwt from 'jsonwebtoken';
import path from 'path';
import query from 'resolve-query';
import commandHandler from 'resolve-command';
import request from 'request';

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

const readModelExecutors = config.readModels.reduce((result, readModel) => {
    if (!readModel.name && config.readModels.length === 1) {
        readModel.name = 'graphql';
    } else if (!readModel.name) {
        raiseError(message.readModelMandatoryName, readModel);
    }
    if (!(!readModel.viewModel ^ !(readModel.gqlSchema && readModel.gqlResolvers))) {
        raiseError(message.readModelQuerySideMandatory, readModel);
    }

    result[readModel.name] = query({ eventStore, readModel });
    result[readModel.name].viewModel = readModel.viewModel;

    return result;
}, {});

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
        readModelExecutors,
        executeCommand,
        eventStore
    };

    next();
});

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

Object.keys(readModelExecutors).forEach((modelName) => {
    const executor = readModelExecutors[modelName];
    if (!executor.viewModel) {
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
    } else {
        app.get(`${rootDirectory}/api/query/${modelName}`, async (req, res) => {
            try {
                const [aggregateIds, eventTypes] = [req.query.aggregateIds, req.query.eventTypes];
                if (!Array.isArray(aggregateIds) && !Array.isArray(eventTypes)) {
                    throw new Error(message.viewModelOnlyOnDemand);
                }

                const result = await executor({ aggregateIds, eventTypes });
                res.status(200).json(result);
            } catch (err) {
                res.status(500).end(`${message.viewModelFail}${err.message}`);
                // eslint-disable-next-line no-console
                console.log(err);
            }
        });
    }
});

const staticMiddleware = process.env.NODE_ENV === 'production'
    ? express.static(path.join(process.cwd(), './dist/static'))
    : (req, res) => {
        const newurl = 'http://localhost:3001' + req.path;
        request(newurl).pipe(res);
    };

app.use(`${rootDirectory}${STATIC_PATH}`, staticMiddleware);

app.get([`${rootDirectory}/*`, `${rootDirectory || '/'}`], async (req, res) => {
    try {
        const state = await config.initialState(readModelExecutors, {
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
