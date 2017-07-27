import { expect } from 'chai';
import sinon from 'sinon';

import createQueryExecutor from '../src';
const brokenStateError = new Error('Broken Error');

describe('resolve-query', () => {
    const READ_MODEL_NAME = 'readModelName';

    let eventStore, eventList;

    const readModels = [
        {
            initialState: {},
            name: READ_MODEL_NAME,
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
        const executeQuery = createQueryExecutor({ eventStore, readModels });
        eventList = [{ type: 'SuccessEvent' }];

        const state = await executeQuery(READ_MODEL_NAME);

        expect(state).to.be.deep.equal({
            value: 42
        });
    });

    it('should handle broken event', async () => {
        const executeQuery = createQueryExecutor({ eventStore, readModels });
        eventList = [{ type: 'BrokenEvent' }];

        try {
            await executeQuery(READ_MODEL_NAME);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error).to.be.equal(brokenStateError);
        }
    });

    it('should handle errors on read side', async () => {
        const readSideError = new Error('Broken Error');
        const executeQuery = createQueryExecutor({ eventStore, readModels });
        eventList = [{ type: 'BrokenEvent' }];

        try {
            await executeQuery(READ_MODEL_NAME);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error).to.be.deep.equal(readSideError);
        }
    });

    it('should handle errors on read side taking by bus', async () => {
        let eventHandler;
        const readSideError = new Error('Broken Error');

        eventStore = {
            subscribeByEventType: sinon.stub().callsFake((eventTypes, handler) => {
                eventHandler = handler;
                return handler(eventList.shift());
            })
        };
        eventList = [{ type: 'SuccessEvent' }, { type: 'SuccessEvent' }];
        const executeQuery = createQueryExecutor({ eventStore, readModels });
        await executeQuery(READ_MODEL_NAME);

        eventHandler({ type: 'BrokenEvent' });

        try {
            await executeQuery(READ_MODEL_NAME);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error).to.be.deep.equal(readSideError);
        }
    });

    it('should handle non-existing query executor', async () => {
        const executeQuery = createQueryExecutor({ eventStore, readModels });
        eventList = [{ type: 'BrokenEvent' }];

        try {
            await executeQuery('WRONG_READ_MODEL_NAME');
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error.message).to.be.equal(
                'The \'WRONG_READ_MODEL_NAME\' read model is not found'
            );
        }
    });

    it('works the same way for different import types', () => {
        expect(createQueryExecutor).to.be.equal(require('../src'));
    });
});
