import { take, put } from 'redux-saga/effects';
import actions, { FETCH_MORE } from './actions';

export default function* fetchMoreSaga({ fetchMore }) {
    while (true) {
        const { projectionName, query } = yield take(FETCH_MORE);

        const state = yield fetchMore(projectionName, query);

        yield put(actions.merge(projectionName, state));
    }
}
