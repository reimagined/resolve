import graphql from 'graphql-anywhere';
import gql from 'graphql-tag';
import http from 'http';
import createEventStore from 'resolve-es';
import createStorage from 'resolve-storage';
import storageDriver from 'resolve-storage-file';
import createBus from 'resolve-bus';
import busDriver from 'resolve-bus-memory';
import commandHandler from 'resolve-command';
import query from 'resolve-query';
import socketIO from 'socket.io';
import uuid from 'uuid';

import { aggregates, projections } from 'todo-common';

const todoCardAggregate = aggregates.TodoCard;
const todoItemAggregate = aggregates.TodoItem;
const cardsProjection = projections.cards;

const PORT = 3001;

const storage = createStorage({
    driver: storageDriver({ pathToFile: './event_store.json' })
});
const bus = createBus({ driver: busDriver() });
const eventStore = createEventStore({ storage, bus });

const execute = commandHandler({
    eventStore,
    aggregates: [todoCardAggregate, todoItemAggregate]
});

const queries = query({
    eventStore,
    projections: [cardsProjection]
});

const server = http.createServer((req, res) => {
    res.writeHead(404);
    return res.end('Page not found');
});

const projectionResolvers = {
    cards: (fieldName, root, args) => {
        if (fieldName === 'cards') {
            if (!args.card) throw new Error('Retrieving all cards in prohibited');

            return Object.keys(root.cards).reduce((todoList, todoItemId) => {
                const aggregateId = root.cards[todoItemId].aggregateId;
                const itemList = root.cards[todoItemId].todoList;

                todoList[todoItemId] = {
                    name: root.cards[todoItemId].name,
                    todoCount: root.cards[todoItemId].todoCount,
                    aggregateId
                };

                if (args.card !== aggregateId) return todoList;

                if (!args.hasOwnProperty('from') && !args.hasOwnProperty('limit')) {
                    todoList[todoItemId].todoList = itemList;
                    return todoList;
                } else if(!args.hasOwnProperty('from') || !args.hasOwnProperty('limit')) {
                    throw new Error('Pagination should use from and limit fields mandatory');
                }

                const todoListKeys = Object.keys(itemList);

                if(!(+args.limit > 0) || (+args.from >= todoListKeys.length)) { // Handle NaN too
                    throw new Error('Pagination from index should be positive and don\'t exceed collection size');
                } else if (!(+args.limit > 0)) { // Handle NaN too
                    throw new Error('Pagination limit should be positive number');
                }

                todoListKeys.splice(0, +args.from);
                todoListKeys.splice(+args.limit, todoListKeys.length - args.limit);

                todoList[todoItemId].todoList = todoListKeys.reduce((acc, key) => {
                    acc[key] = itemList[key];
                    return acc;
                }, {});

                return todoList;
            }, {});

        } else if (fieldName === 'mapTodoToCard') {
            if (!args.card) throw new Error('Retrieving all cards in prohibited');

            return Object.keys(root.mapTodoToCard).reduce((acc, key) => {
                if(root.mapTodoToCard[key] === args.card) {
                    acc[key] = root.mapTodoToCard[key];
                }

                return acc;
            }, {});
        }

        throw new Error('Invalid field name');
    }
};

function filteredQuery(projectionName, filter) {
    return queries(projectionName).then(state => graphql(
        projectionResolvers[projectionName],
        gql`${filter}`,
        state
    ));
}

const io = socketIO(server);

const eventNames = Object.keys(cardsProjection.eventHandlers);

io.on('connection', (socket) => {
    (new Promise((resolve) => {
        socket.on('initialState', ({ projectionName, filter }) =>
            filteredQuery(projectionName, filter).then(state =>
                socket.emit('initialState', { projectionName, state })
            ).then(resolve)
        );

        socket.on('command', (command) => {
            command.aggregateId = command.aggregateId || uuid.v4();

            // eslint-disable-next-line no-console
            execute(command).catch(err => console.log(err));
        });
    })).then(() => {
        const unsubscribe = bus.onEvent(eventNames, event => socket.emit('event', event));

        socket.on('disconnect', () => unsubscribe());
    });
});

server.on('listening', () => {
    // eslint-disable-next-line no-console
    console.log(`Example app listening on port ${PORT}!`);
});

server.listen(PORT);
