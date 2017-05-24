import { put, call } from 'redux-saga/effects';
import actions from './actions';

export default function* fetchMoreSaga({ fetchMore }, { projectionName, query }) {
    const state = yield call(fetchMore, projectionName, query);
    yield put(actions.merge(projectionName, state));
}
