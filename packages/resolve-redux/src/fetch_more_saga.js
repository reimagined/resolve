import 'regenerator-runtime/runtime';
import { put, call } from 'redux-saga/effects';
import actions from './actions';
import checkRequiredFields from './warn_util';

export default function* fetchMoreSaga({ fetchMore }, { projectionName, query }) {
    if (checkRequiredFields({ projectionName, query }, 'Fetch more error:')) {
        return;
    }

    const state = yield call(fetchMore, projectionName, query);
    yield put(actions.merge(projectionName, state));
}
