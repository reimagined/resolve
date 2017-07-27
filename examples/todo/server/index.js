import http from 'http';
import socketIO from 'socket.io';
import uuid from 'uuid';
import createBus from 'resolve-bus';
import busDriver from 'resolve-bus-zmq';

import { readModels } from 'todo-common';
import makeIpc from './ipc';

const bus = createBus({
    driver: busDriver({
        address: '127.0.0.1',
        pubPort: 3500,
        subPort: 3501
    })
});

const cardsReadModel = readModels.cards;

const PORT = 3001;

const server = http.createServer((req, res) => {
    res.writeHead(404);
    return res.end('Page not found');
});

const io = socketIO(server);

const eventNames = Object.keys(cardsReadModel.eventHandlers);

const requestReadModel = makeIpc('./query/index.js');
const requestCommand = makeIpc('./command/index.js');

io.on('connection', (socket) => {
    requestReadModel('cards').then(({ state }) => socket.emit('initialState', state)).then(() => {
        socket.on('command', (command) => {
            command.aggregateId = command.aggregateId || uuid.v4();

            // eslint-disable-next-line no-console
            requestCommand(command).catch(err => console.log(err));
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
