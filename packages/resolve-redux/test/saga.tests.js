import { takeEvery } from 'redux-saga/effects';
import { expect } from 'chai';
import saga from '../src/saga';
import sendCommandSaga from '../src/send_command_saga';
import fetchMoreSaga from '../src/fetch_more_saga';
import { FETCH_MORE } from '../src/actions';

describe('saga', () => {
    it('works correctly', () => {
        const args = {
            /* ... */
        };
        const generator = saga(args);
        expect(generator.next().value).to.be.deep.equal(takeEvery('*', sendCommandSaga, args));
        expect(generator.next().value).to.be.deep.equal(takeEvery(FETCH_MORE, fetchMoreSaga, args));
    });
});
