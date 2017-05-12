import { fork } from 'redux-saga/effects';
import sendCommandSaga from './sendCommandSaga';
import fetchMoreSaga from './fetchMoreSaga';

export default function* saga(args) {
    yield [fork(sendCommandSaga, args), fork(fetchMoreSaga, args)];
}
