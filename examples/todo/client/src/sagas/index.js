import io from 'socket.io-client';
import { eventChannel } from 'redux-saga';
import { fork, put, call, all, takeEvery } from 'redux-saga/effects';
import { actions, saga as resolveSaga } from 'resolve-redux';
import { aggregates } from 'todo-common';

const projections = ['cards'];
const projectionDefaultFilters = {
    cards: `{
        cards (card: "no-card")
        mapTodoToCard(card: "no-card")
    }`
};

const allCommandTypes = Object.keys(aggregates).reduce((result, aggregateName) => {
    const { commands } = aggregates[aggregateName];
    const types = Object.keys(commands);
    return result.concat(types);
}, []);

const commandTypes = allCommandTypes.reduce(
    (result, type) => (result.indexOf(type) >= 0 ? result : result.concat(type)),
    []
);

function subscribeOnSocket(socket) {
    return eventChannel((emit) => {
        socket.on('event', event => emit(event));
        return () => {};
    });
}

function* initCommandSender(socket) {
    yield all(
        commandTypes.map(typeName =>
            takeEvery(typeName, command => socket.emit('command', command))
        )
    );
}

function* initEventGetter(socket) {
    const channel = yield call(subscribeOnSocket, socket);

    yield takeEvery(channel, function*(action) {
        yield put(action);
    });
}

function* initSocket() {
    const REQUEST_INITIAL_STATE = (actions.requestInitialState()).type;
    const initialStatePromises = {};

    const socket = yield call(() => new Promise((resolve, reject) => {
        const socket = io('/', resolve);
        socket.on('connect', error => (error ? reject(error) : resolve(socket)));

        socket.on('initialState', ({ projectionName, state }) => {
            if (!initialStatePromises[projectionName]) return;
            initialStatePromises[projectionName].resolver(state);
        });
    }));

    yield takeEvery(REQUEST_INITIAL_STATE, function*({ projectionName, filter }) {
        const resultFilter = filter || projectionDefaultFilters[projectionName] || '';

        if (!initialStatePromises[projectionName]) {
            initialStatePromises[projectionName] = {};
        }

        initialStatePromises[projectionName].promise = new Promise(resolve =>
            (initialStatePromises[projectionName].resolver = resolve)
        );

        socket.emit('initialState', { projectionName, filter: resultFilter });

        const initialState = yield call(
            () => initialStatePromises[projectionName].promise
        );

        yield put(actions.setState(projectionName, initialState));
    });

    yield all([
        fork(initEventGetter, socket),
        fork(initCommandSender, socket)
    ]);
}

export default function*() {
    yield* initSocket();
    yield* resolveSaga({ projections });
}
