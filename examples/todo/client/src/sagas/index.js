import io from 'socket.io-client';
import { eventChannel } from 'redux-saga';
import { fork, put, call, all, takeEvery } from 'redux-saga/effects';

import { setState, todoCardCreated } from '../actions';

function subscribeOnSocket(socket) {
    return eventChannel((emit) => {
        socket.on('initialState', state => emit(setState(state)));
        socket.on('event', event => emit(todoCardCreated(event)));

        return () => {};
    });
}

function* subscribeOnCommand(socket) {
    yield takeEvery('create', command => socket.emit('command', command));
}

function* getEvent(socket) {
    const channel = yield call(subscribeOnSocket, socket);

    yield takeEvery(channel, function* (action) {
        yield put(action);
    })
}

function* initSocket() {
    const socket = yield call(() =>
        new Promise((resolve, reject) => {
            const socket = io('/', resolve);

            socket.on('connect', error => (
                error ? reject(error) : resolve(socket)
            ));
        })
    );

    yield all([
        fork(getEvent, socket),
        fork(subscribeOnCommand, socket)
    ]);
}

export default function*() {
    yield initSocket();
}
