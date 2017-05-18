import fetch from 'isomorphic-fetch';
import io from 'socket.io-client';
import { fork, take, put, call, all } from 'redux-saga/effects';

import { updateCards } from '../actions/cards';

function* getInitialCards() {
    const cards = yield call(() =>
        fetch('/api/cards').then(res => res.json())
    );
    yield put(updateCards(cards));
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

    while (true) {
        const action = yield take('create');

        const error = yield call(() =>
            new Promise(resolve =>
                socket.emit('command', action, resolve)
            )
        );

        if (error) {
            yield put(error);
        }
    }
}

export default function*() {
    yield all([
        fork(getInitialCards),
        fork(initSocket)
    ]);
}
