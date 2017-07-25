import bodyParser from 'body-parser';
import express from 'express';
import path from 'path';
import query from 'resolve-query';
import commandHandler from 'resolve-command';
import ssr from './render';

import eventStore from './event_store';

// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
import config from 'RESOLVE_SERVER_CONFIG';

const STATIC_PATH = '/static';
const rootDirectory = config.rootDirectory || '';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const executeQuery = query({
    eventStore,
    projections: config.queries
});

const executeCommand = commandHandler({
    eventStore,
    aggregates: config.aggregates
});

if (config.gateways) {
    config.gateways.forEach(gateway => gateway({ executeQuery, executeCommand, eventStore }));
}

app.use((req, res, next) => {
    req.resolve = {
        executeQuery,
        executeCommand,
        eventStore,
        ssr
    };
    next();
});

app.use(
    `${rootDirectory}${STATIC_PATH}`,
    express.static(path.join(__dirname, '../../dist/static'))
);

try {
    config.extendExpress(app);
} catch (err) {}

app.get(`${rootDirectory}/api/queries/:queryName`, (req, res) => {
    executeQuery(req.params.queryName).then(state => res.status(200).json(state)).catch((err) => {
        res.status(500).end('Query error: ' + err.message);
        // eslint-disable-next-line no-console
        console.log(err);
    });
});

app.post(`${rootDirectory}/api/commands`, (req, res) => {
    executeCommand(req.body).then(() => res.status(200).send('ok')).catch((err) => {
        res.status(500).end('Command error:' + err.message);
        // eslint-disable-next-line no-console
        console.log(err);
    });
});

app.get([`${rootDirectory}/*`, `${rootDirectory || '/'}`], async (req, res) => {
    const readModels = config.initialReadModels || [];

    try {
        const states = await Promise.all(readModels.map(readModel => executeQuery(readModel)));

        ssr(
            readModels.reduce((result, name, index) => {
                result[name] = states[index];
                return result;
            }, {}),
            { req, res }
        );
    } catch (err) {
        res.status(500).end('SSR error: ' + err.message);
        // eslint-disable-next-line no-console
        console.log(err);
    }
});

export default app;
