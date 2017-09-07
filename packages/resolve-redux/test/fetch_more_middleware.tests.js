import sinon from 'sinon';
import { expect } from 'chai';
import { actions } from '../src';
import { createStore, applyMiddleware } from 'redux';
import fetchMoreMiddleware from '../src/fetch_more_middleware';
import { MERGE_STATE } from '../src/actions';

describe('fetchMoreMiddleware', () => {
    let originalWarn;

    const state = {
        id1: {
            /* ... */
        },
        id2: {
            /* ... */
        }
    };

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

    it('works correctly', (done) => {
        let store = null;
        const readModelName = 'readModelName';
        const query = { ownerId: 'userId-12345' };
        const fetchResult = { id3: {}, id4: {} };
        const fetchMore = sinon.spy(() => {
            const promise = new Promise(resolve => resolve(fetchResult)).then((data) => {
                promise
                    .then(() => {
                        const newState = store.getState();
                        expect(newState).to.be.deep.equal({ ...state, ...fetchResult });
                        expect(fetchMore.firstCall.args[0]).to.be.equal(readModelName);
                        expect(fetchMore.firstCall.args[1]).to.be.deep.equal(query);
                        done();
                    })
                    .catch(done);
                return data;
            });
            return promise;
        });

        store = createStore(
            (state, action) => {
                switch (action.type) {
                    case MERGE_STATE:
                        return { ...state, ...action.state };
                    default:
                        return state;
                }
            },
            state,
            applyMiddleware(fetchMoreMiddleware({ fetchMore }))
        );
        const fetchAction = actions.fetchMore(readModelName, query);
        store.dispatch(fetchAction);
    });

    it('should throw error on send command if some of required fields are not defined', () => {
        const store = createStore(
            () => {},
            applyMiddleware(fetchMoreMiddleware({ fetchMore: () => {} }))
        );
        const fetchAction = actions.fetchMore('', null);
        store.dispatch(fetchAction);

        // eslint-disable-next-line no-console
        expect(console.warn.callCount).to.be.equal(1);

        // eslint-disable-next-line no-console
        const warnArgs = console.warn.args[0];

        expect(warnArgs[0]).contains('Fetch more error:');
        expect(warnArgs[0]).contains('The \'readModelName\' is required');
        expect(warnArgs[0]).contains('The \'query\' is required');
    });
});
