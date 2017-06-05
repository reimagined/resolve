import sinon from 'sinon';
import { call, put } from 'redux-saga/effects';
import { expect } from 'chai';
import { actions } from '../src';
import fetchMoreSaga from '../src/fetch_more_saga';

describe('fetchMoreSaga', () => {
    let sandbox;
    let originalWarn;

    const state = {
        id1: {
            /* ... */
        },
        id2: {
            /* ... */
        }
    };

    before(() => {
        sandbox = sinon.sandbox.create();
        sandbox.spy(actions, 'merge');
    });

    after(() => {
        sandbox.restore();
    });

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
        const fetchMore = sinon.spy();
        const projectionName = 'projectionName';
        const query = { ownerId: 'userId-12345' };

        const generator = fetchMoreSaga({ fetchMore }, { projectionName, query });

        expect(generator.next().value).to.be.deep.equal(call(fetchMore, projectionName, query));

        expect(generator.next(state).value).to.be.deep.equal(
            put(actions.merge(projectionName, state))
        );
    });

    it('should throw error on send command if some of required fields are not defined', () => {
        const args = { sendCommand() {} };
        const action = actions.sendCommand({});
        const generator = fetchMoreSaga(args, action);
        generator.next();

        // eslint-disable-next-line no-console
        expect(console.warn.callCount).to.be.equal(1);

        // eslint-disable-next-line no-console
        const warnArgs = console.warn.args[0];

        expect(warnArgs[0]).contains('Fetch more error:');
        expect(warnArgs[0]).contains('The \'projectionName\' is required');
        expect(warnArgs[0]).contains('The \'query\' is required');
    });
});
