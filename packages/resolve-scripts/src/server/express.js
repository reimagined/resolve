import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import jwt from 'jsonwebtoken';
import path from 'path';
import query from 'resolve-query';
import commandHandler from 'resolve-command';
import request from 'request';

import eventStore from './event_store';
import ssr from './render';

import config from '../configs/server.config.js';

const STATIC_PATH = '/static';
const rootDirectory = process.env.ROOT_DIR || '';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const executeQuery = query({
    eventStore,
    readModels: config.queries
});

const executeCommand = commandHandler({
    eventStore,
    aggregates: config.aggregates
});

if (config.gateways) {
    config.gateways.forEach(gateway => gateway({ executeQuery, executeCommand, eventStore }));
}

app.use((req, res, next) => {
    req.getJwt = jwt.verify.bind(
        null,
        req.cookies && req.cookies[config.jwt.cookieName],
        config.jwt.secret,
        config.jwt.options
    );

    req.resolve = {
        executeQuery,
        executeCommand,
        eventStore
    };

    next();
});

try {
    config.extendExpress(app);
} catch (err) {}

app.get(`${rootDirectory}/api/queries/:queryName`, async (req, res) => {
    try {
        const { graphql, variables } = req.query;
        const state = await executeQuery(
            req.params.queryName,
            graphql,
            JSON.parse(variables || '{}'),
            req.jwt
        );

        res.status(200).json(state);
    } catch (err) {
        res.status(500).end('Query error: ' + err.message);
        // eslint-disable-next-line no-console
        console.log(err);
    }
});

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

const staticMiddleware = process.env.NODE_ENV === 'production'
    ? express.static(path.join(process.cwd(), './dist/static'))
    : (req, res) => {
        var newurl = 'http://localhost:3001' + req.path;
        request(newurl).pipe(res);
    };

app.use(`${rootDirectory}${STATIC_PATH}`, staticMiddleware);

app.get([`${rootDirectory}/*`, `${rootDirectory || '/'}`], async (req, res) => {
    try {
        const state = await config.initialState(executeQuery, {
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
