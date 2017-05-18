import express from 'express';
import http from 'http';
import socketIO from 'socket.io';
import bodyParser from 'body-parser';
import uuid from 'uuid';

import createStore from 'resolve-es';
import esDriver from 'resolve-es-file';
import createBus from 'resolve-bus';
import busDriver from 'resolve-bus-memory';
import commandHandler from 'resolve-command';
import query from 'resolve-query';

import todoCardAggregate from './aggregates/TodoCard';
import todoItemAggregate from './aggregates/TodoItem';
import cardsProjection from './projections/cards';
import cardDetailsProjection from './projections/cardDetails';

const PORT = 3001;

const setupMiddlewares = (app) => {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.set('views', './views');
};

const app = express();
const server = http.Server(app);
const io = socketIO(server);

app.use(express.static('static'));

const eventStore = createStore({
    driver: esDriver({ pathToFile: './event_store.json' })
});
const bus = createBus({ driver: busDriver() });

const execute = commandHandler({
    store: eventStore,
    bus,
    aggregates: [todoCardAggregate, todoItemAggregate]
});

const queries = query({
    store: eventStore,
    bus,
    projections: [cardsProjection, cardDetailsProjection]
});

setupMiddlewares(app);

app.get('/api/cards', (req, res) =>
    queries('cardDetails').then(state => res.json(state.cards))
);

app.post('/api', (req, res) => {
    const command = Object.keys(req.body)
        .reduce((result, key) => {
            result[key] = req.body[key];
            return result;
        }, {});

    command.aggregateId = command.aggregateId || uuid.v4();

    execute(command)
        .catch((err) => {
            // eslint-disable-next-line no-console
            console.log(err);
        })
        .then(() => res.status(201).end());
});

io.on('connection', (socket) => {
    socket.on('command', (command) => {
        command.aggregateId = command.aggregateId || uuid.v4();

        // eslint-disable-next-line no-console
        execute(command).catch(err => console.log(err));
    });
});

server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Example app listening on port ${PORT}!`);
});
