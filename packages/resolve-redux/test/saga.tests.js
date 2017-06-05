import { takeEvery } from 'redux-saga/effects';
import { expect } from 'chai';
import sinon from 'sinon';
import saga from '../src/saga';
import sendCommandSaga from '../src/send_command_saga';
import fetchMoreSaga from '../src/fetch_more_saga';
import actions, { FETCH_MORE } from '../src/actions';

describe('saga', () => {
    let originalWarn;

    beforeEach(() => {
        // eslint-disable-next-line no-console
        originalWarn = console.warn;
        // eslint-disable-next-line no-console
        console.warn = sinon.spy();
    });

    afterEach(() => {
        // eslint-disable-next-line no-console
        console.warn = originalWarn;
    });

    it('works correctly', () => {
        const args = {
            /* ... */
        };
        const generator = saga(args);
        expect(generator.next().value).to.be.deep.equal(takeEvery('*', sendCommandSaga, args));
        expect(generator.next().value).to.be.deep.equal(takeEvery(FETCH_MORE, fetchMoreSaga, args));
    });

    it('should throw error on send command if some of required fields are not defined', () => {
        const args = { sendCommand() {} };
        const action = actions.sendCommand({});
        const generator = sendCommandSaga(args, action);
        generator.next();

        // eslint-disable-next-line no-console
        expect(console.warn.callCount).to.be.equal(1);

        // eslint-disable-next-line no-console
        const warnArgs = console.warn.args[0];

        expect(warnArgs[0]).contains('Send command error:');
        expect(warnArgs[0]).contains('The \'command\' is required');
        expect(warnArgs[0]).contains('The \'aggregateId\' is required');
        expect(warnArgs[0]).contains('The \'aggregateName\' is required');
        expect(warnArgs[0]).contains(JSON.stringify(action));
    });
});
