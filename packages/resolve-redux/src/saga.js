import { fork } from 'redux-saga/effects';
import sendCommandSaga from './send_command_saga';
import fetchMoreSaga from './fetch_more_saga';

export default function* saga (args) {
    yield [fork(sendCommandSaga, args), fork(fetchMoreSaga, args)];
}
