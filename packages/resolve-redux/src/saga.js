import { takeEvery, put } from 'redux-saga/effects';
import actions, { FETCH_MORE, SET_PROJECTION_FILTERING } from './actions';
import sendCommandSaga from './send_command_saga';
import fetchMoreSaga from './fetch_more_saga';
import setProjectionFiltering from './set_projection_filtering_saga.js';

export default function* saga(args) {
    yield takeEvery('*', sendCommandSaga, args);
    yield takeEvery(SET_PROJECTION_FILTERING, setProjectionFiltering, args);
    yield takeEvery(FETCH_MORE, fetchMoreSaga, args);

    if (Array.isArray(args.projections)) {
        for(const name of args.projections) {
            yield put(actions.requestInitialState(name, null));
        }
    } else {
        throw new Error('Projections list should be specified');
    }
}
