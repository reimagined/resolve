import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import jwt from 'jsonwebtoken';
import path from 'path';
import query from 'resolve-query';
import commandHandler from 'resolve-command';
import request from 'request';

import { getSourceInfo, raiseError } from './utils/error_handling.js';
import eventStore from './event_store';
import ssr from './render';

import config from '../configs/server.config.js';

const STATIC_PATH = '/static';
const rootDirectory = process.env.ROOT_DIR || '';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

if (!Array.isArray(config.readModels)) {
    raiseError(`Read models declaration should be array ${getSourceInfo(config.readModels)}`);
}

const readModelExecutors = config.readModels.reduce((result, readModel) => {
    if (!readModel.name) {
        raiseError(`Read model name is mandatory ${getSourceInfo(readModel)}`);
    }
    if (!(readModel.viewModel ^ (readModel.gqlSchema && readModel.gqlResolvers))) {
        raiseError(
            // eslint-disable-next-line max-len
            `Read model should have fields gqlSchema and gqlResolvers or be turned in view model ${getSourceInfo(
                readModel
            )}`
        );
    }

    result[readModel.name] = query({
        eventStore,
        readModel
    });
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
        res.status(200).send('ok');
    } catch (err) {
        res.status(500).end('Command error:' + err.message);
        // eslint-disable-next-line no-console
        console.log(err);
    }
});

Object.keys(readModelExecutors).forEach((modelName) => {
    const executor = readModelExecutors[modelName];
    app.post(
        `${rootDirectory}/api/query/${modelName}`,
        bodyParser.urlencoded({ extended: false }),
        async (req, res) => {
            try {
                const data = await executor(req.body.query, req.body.variables || {}, req.jwt);
                res.status(200).send({ data });
            } catch (err) {
                res.status(500).end('Query error: ' + err.message);
                // eslint-disable-next-line no-console
                console.log(err);
            }
        }
    );
});

const staticMiddleware = process.env.NODE_ENV === 'production'
    ? express.static(path.join(process.cwd(), './dist/static'))
    : (req, res) => {
        var newurl = 'http://localhost:3001' + req.path;
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
        res.status(500).end('SSR error: ' + err.message);
        // eslint-disable-next-line no-console
        console.log(err);
    }
});

export default app;
