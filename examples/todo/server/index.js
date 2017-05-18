import http from 'http';
import socketIO from 'socket.io';
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

const server = http.createServer((req, res) => {
    res.writeHead(404);
    return res.end('Page not found');
});

const io = socketIO(server);

io.on('connection', (socket) => {
    queries('cardDetails')
        .then(state => socket.emit('initialState', state))
        .then(() => {
            socket.on('command', (command) => {
                command.aggregateId = command.aggregateId || uuid.v4();

                // eslint-disable-next-line no-console
                execute(command).catch(err => console.log(err));
            });

            const unsubscribe = bus.onEvent(['TodoCardCreated'], event =>
                socket.emit('event', event)
            );

            socket.on('disconnect', () => unsubscribe());
        })
});

server.on('listening', () => {
    // eslint-disable-next-line no-console
    console.log(`Example app listening on port ${PORT}!`);
});

server.listen(PORT);
