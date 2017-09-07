import io from 'socket.io-client';
import { eventChannel } from 'redux-saga';
import { fork, put, call, all, takeEvery } from 'redux-saga/effects';
import { actions } from 'resolve-redux';
import { aggregates } from 'todo-common';

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
        socket.on('initialState', state => emit(actions.mergeState('cards', state)));
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
    const socket = yield call(
        () =>
            new Promise((resolve, reject) => {
                const socket = io('/', resolve);

                socket.on('connect', error => (error ? reject(error) : resolve(socket)));
            })
    );

    yield all([fork(initEventGetter, socket), fork(initCommandSender, socket)]);
}

export default function*() {
    yield initSocket();
}
