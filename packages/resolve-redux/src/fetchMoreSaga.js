import { take } from 'redux-saga/effects';
import { FETCH_MORE } from './actions';

// TODO
export default function* fetchMoreSaga() {
    while (true) {
        const action = yield take(FETCH_MORE);
        // ...
        action();
    }
}
