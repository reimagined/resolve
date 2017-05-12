import sinon from 'sinon';
import { take, put } from 'redux-saga/effects';
import { expect } from 'chai';
import fetchMoreSaga from '../src/fetch_more_saga';
import actions, { FETCH_MORE } from '../src/actions';

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

    // eslint-disable-next-line
    before(() => {
        sandbox = sinon.sandbox.create();
        sandbox.spy(actions, 'merge');
    });

    // eslint-disable-next-line
    after(() => {
        sandbox.restore();
    });

    it('works correctly', () => {
        const fetchMore = sinon.spy();
        const projectionName = 'projectionName';
        const query = { ownerId: 'userId-12345' };

        const generator = fetchMoreSaga({ fetchMore });

        expect(generator.next().value).to.be.deep.equal(take(FETCH_MORE));

        generator.next({ projectionName, query });

        expect(generator.next(state).value).to.be.deep.equal(
            put(actions.merge(projectionName, state))
        );

        expect(generator.next().value).to.be.deep.equal(take(FETCH_MORE));
    });
});
