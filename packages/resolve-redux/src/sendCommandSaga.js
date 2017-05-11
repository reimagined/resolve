import { take } from 'redux-saga/effects';

// TODO
export default function* sendCommandSaga() {
    while (true) {
        const action = yield take('*');
        // ...
        action();
    }
}
