import bodyParser from 'body-parser';
import express from 'express';
import path from 'path';
import query from 'resolve-query';
import commandHandler from 'resolve-command';
import ssr from './render';

import eventStore from './event_store';

// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
import config from 'RESOLVE_CONFIG';

const INITIAL_READ_MODEL = 'todos';
const STATIC_PATH = '/static';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    const buildConfig = require('RESOLVE_BUILD_CONFIG');
    buildConfig.extendExpress(app);
} catch (err) { }

const executeQuery = query({
    eventStore,
    projections: config.queries
});

const executeCommand = commandHandler({
    eventStore,
    aggregates: config.aggregates
});

app.get('/api/queries/:queryName', (req, res) => {
    executeQuery(req.params.queryName).then(state => res.status(200).json(state)).catch((err) => {
        res.status(500).end('Query error: ' + err.message);
        // eslint-disable-next-line no-console
        console.log(err);
    });
});

app.post('/api/commands', (req, res) => {
    executeCommand(req.body).then(() => res.status(200).send('ok')).catch((err) => {
        res.status(500).end('Command error:' + err.message);
        // eslint-disable-next-line no-console
        console.log(err);
    });
});

app.use(STATIC_PATH, express.static(path.join(__dirname, '../../dist/static')));

app.get('/*', (req, res) =>
    executeQuery(INITIAL_READ_MODEL).then(state => ssr(state, { req, res })).catch((err) => {
        res.status(500).end('SSR error: ' + err.message);
        // eslint-disable-next-line no-console
        console.log(err);
    })
);

export default app;
