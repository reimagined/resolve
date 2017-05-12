import { fork } from 'redux-saga/effects';
import { expect } from 'chai';
import saga from '../src/saga';
import sendCommandSaga from '../src/send_command_saga';
import fetchMoreSaga from '../src/fetch_more_saga';

describe('saga', () => {
    it('works correctly', () => {
        const args = {
            /* ... */
        };
        const generator = saga(args);

        expect(generator.next(args).value).to.be.deep.equal([
            fork(sendCommandSaga, args),
            fork(fetchMoreSaga, args)
        ]);
    });
});
