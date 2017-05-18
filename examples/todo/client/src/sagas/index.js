import fetch from 'isomorphic-fetch';
import io from 'socket.io-client';
import { eventChannel } from 'redux-saga';
import { fork, take, put, call, all } from 'redux-saga/effects';

import { updateCards, todoCardCreated } from '../actions/cards';

function* getInitialCards() {
    const cards = yield call(() =>
        fetch('/api/cards').then(res => res.json())
    );
    yield put(updateCards(cards));
}

function* sendCommand(socket) {
    while (true) {
        const action = yield take('create');
        socket.emit('command', action);
    }
}

export function subscribeOnSocket(socket) {
    return eventChannel((emit) => {
        socket.on('event', event =>
            emit(todoCardCreated(event))
        );

        return () => {};
    });
}

function* getEvent(socket) {
    const channel = yield call(subscribeOnSocket, socket);
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const action = yield take(channel);
        yield put(action);
    }
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
        fork(sendCommand, socket),
        fork(getEvent, socket)
    ]);
}

export default function*() {
    yield all([
        fork(getInitialCards),
        fork(initSocket)
    ]);
}
