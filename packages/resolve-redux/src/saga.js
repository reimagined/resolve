import sendCommandSaga from './sendCommandSaga';
import fetchMoreSaga from './fetchMoreSaga';

// TODO
export default function* saga() {
    yield [sendCommandSaga, fetchMoreSaga];
}
