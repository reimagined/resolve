import http from 'http';
import socketIO from 'socket.io';
import uuid from 'uuid';
import createEventStore from 'resolve-es';
import busDriver from 'resolve-bus-zmq';

import { readModel } from 'todo-common';
import makeIpc from './ipc';
import config from './config';

const eventStore = createEventStore({ bus: busDriver(config.zmq) });

const PORT = 3001;

const server = http.createServer((req, res) => {
    res.writeHead(404);
    return res.end('Page not found');
});

const io = socketIO(server);

const eventNames = Object.keys(readModel.eventHandlers);

const requestReadModel = makeIpc('./query/index.js');
const requestCommand = makeIpc('./command/index.js');

io.on('connection', (socket) => {
    requestReadModel().then(({ state }) => socket.emit('initialState', state)).then(() => {
        socket.on('command', (command) => {
            command.aggregateId = command.aggregateId || uuid.v4();

            // eslint-disable-next-line no-console
            requestCommand(command).catch(err => console.log(err));
        });

        const unsubscribe = eventStore.subscribeByEventType(
            eventNames,
            event => socket.emit('event', event),
            true
        );

        socket.on('disconnect', () => unsubscribe());
    });
});

server.on('listening', () => {
    // eslint-disable-next-line no-console
    console.log(`Example app listening on port ${PORT}!`);
});

server.listen(PORT);
