import sinon from 'sinon';
import { call, put } from 'redux-saga/effects';
import { expect } from 'chai';
import { actions } from '../src';
import fetchMoreSaga from '../src/fetch_more_saga';

describe('fetchMoreSaga', () => {
    let sandbox;

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
});
