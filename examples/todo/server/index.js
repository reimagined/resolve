import http from 'http';
import socketIO from 'socket.io';
import uuid from 'uuid';

import createStore from 'resolve-es';
import esDriver from 'resolve-es-file';
import createBus from 'resolve-bus';
import busDriver from 'resolve-bus-memory';
import commandHandler from 'resolve-command';
import query from 'resolve-query';

import { aggregates, projections } from 'todo-common';

const todoCardAggregate = aggregates.TodoCard;
const todoItemAggregate = aggregates.TodoItem;
const cardsProjection = projections.cards;

const PORT = 3001;

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
    projections: [cardsProjection]
});

const server = http.createServer((req, res) => {
    res.writeHead(404);
    return res.end('Page not found');
});

const io = socketIO(server);

const eventNames = Object.keys(cardsProjection.eventHandlers);

io.on('connection', (socket) => {
    queries('cards').then(state => socket.emit('initialState', state)).then(() => {
        socket.on('command', (command) => {
            command.aggregateId = command.aggregateId || uuid.v4();

            // eslint-disable-next-line no-console
            execute(command).catch(err => console.log(err));
        });

        const unsubscribe = bus.onEvent(eventNames, event => socket.emit('event', event));

        socket.on('disconnect', () => unsubscribe());
    });
});

server.on('listening', () => {
    // eslint-disable-next-line no-console
    console.log(`Example app listening on port ${PORT}!`);
});

server.listen(PORT);
