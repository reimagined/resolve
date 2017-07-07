import 'regenerator-runtime/runtime';
import { takeEvery } from 'redux-saga/effects';
import sendCommandSaga from './send_command_saga';
import fetchMoreSaga from './fetch_more_saga';
import { FETCH_MORE } from './actions';

export default function* saga(args) {
    yield takeEvery('*', sendCommandSaga, args);
    yield takeEvery(FETCH_MORE, fetchMoreSaga, args);
}
