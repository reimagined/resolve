import 'regenerator-runtime/runtime';
import { expect } from 'chai';
import sinon from 'sinon';

import createQueryExecutor from '../src';
const brokenStateError = new Error('Broken Error');

describe('resolve-query', () => {
    const PROJECTION_NAME = 'projectionName';

    let eventStore, eventList;

    const projections = [
        {
            initialState: {},
            name: PROJECTION_NAME,
            eventHandlers: {
                SuccessEvent: (state, event) => {
                    return { ...state, value: 42 };
                },
                BrokenEvent: (state, event) => {
                    throw brokenStateError;
                }
            }
        }
    ];

    beforeEach(() => {
        eventList = [];

        eventStore = {
            subscribeByEventType: sinon
                .stub()
                .callsFake((eventTypes, handler) => handler(eventList.shift()))
        };
    });

    afterEach(() => {
        eventStore = null;
        eventList = null;
    });

    it('should build state on valid event and return it on query', async () => {
        const executeQuery = createQueryExecutor({ eventStore, projections });
        eventList = [{ type: 'SuccessEvent' }];

        const state = await executeQuery(PROJECTION_NAME);

        expect(state).to.be.deep.equal({
            value: 42
        });
    });

    it('should handle broken event', async () => {
        const executeQuery = createQueryExecutor({ eventStore, projections });
        eventList = [{ type: 'BrokenEvent' }];

        try {
            await executeQuery(PROJECTION_NAME);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error).to.be.equal(brokenStateError);
        }
    });

    it('should handle errors on read side', async () => {
        const readSideError = new Error('Broken Error');
        const executeQuery = createQueryExecutor({ eventStore, projections });
        eventList = [{ type: 'BrokenEvent' }];

        try {
            await executeQuery(PROJECTION_NAME);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error).to.be.deep.equal(readSideError);
        }
    });

    it('should handle errors on read side taking by bus', async () => {
        let eventHandler;
        const readSideError = new Error('Broken Error');

         eventStore = {
            subscribeByEventType: sinon
                .stub()
                .callsFake((eventTypes, handler) => {
                    eventHandler = handler;
                    return handler(eventList.shift());
                })
        };
        eventList = [{ type: 'SuccessEvent' }, { type: 'SuccessEvent' }];
        const executeQuery = createQueryExecutor({ eventStore, projections });
        await executeQuery(PROJECTION_NAME);
        
        eventHandler({ type: 'BrokenEvent' })
        
        try {
            await executeQuery(PROJECTION_NAME);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error).to.be.deep.equal(readSideError);
        }
    });

    it('should handle non-existing query executor', async () => {
        const executeQuery = createQueryExecutor({ eventStore, projections });
        eventList = [{ type: 'BrokenEvent' }];

        try {
            await executeQuery('WRONG_PROJECTION_NAME');
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error.message).to.be.equal(
                'The \'WRONG_PROJECTION_NAME\' projection is not found'
            );
        }
    });

    it('works the same way for different import types', () => {
        expect(createQueryExecutor).to.be.equal(require('../src'));
    });
});
