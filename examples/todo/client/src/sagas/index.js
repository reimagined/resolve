import fetch from 'isomorphic-fetch';
import io from 'socket.io-client';
import { eventChannel } from 'redux-saga';
import { fork, put, call, all, takeEvery } from 'redux-saga/effects';

import { updateCards, todoCardCreated } from '../actions/cards';

function* getInitialCards() {
    const cards = yield call(() =>
        fetch('/api/cards').then(res => res.json())
    );
    yield put(updateCards(cards));
}

function subscribeOnSocket(socket) {
    return eventChannel((emit) => {
        socket.on('event', event =>
            emit(todoCardCreated(event))
        );

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
        fork(subscribeOnCommand, socket),
        fork(getEvent, socket)
    ]);
}

export default function*() {
    yield all([
        fork(getInitialCards),
        fork(initSocket)
    ]);
}
