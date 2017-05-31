import 'regenerator-runtime/runtime';
import { expect } from 'chai';
import sinon from 'sinon';

import createQueryExecutor from '../src';
const brokenStateError = new Error('Broken Error');

describe('resolve-query', () => {
    const PROJECTION_NAME = 'projectionName';

    let eventStore, onReadable, onError, eventList;

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
            getStreamByEventTypes: sinon.stub().callsFake(() => {
                const on = sinon.stub();
                on.withArgs('readable').callsFake((_, callback) => (onReadable = callback));
                on.withArgs('error').callsFake((_, callback) => (onError = callback));

                return {
                    on,
                    read: sinon.stub().callsFake(() => {
                        const event = eventList.shift();
                        if (event) return event;
                        return null;
                    })
                };
            })
        };
    });

    afterEach(() => {
        eventStore = null;
        onReadable = null;
        onError = null;
        eventList = null;
    });

    it('should build state on valid event and return it on query', async () => {
        const executeQuery = createQueryExecutor({ eventStore, projections });
        eventList = [{ type: 'SuccessEvent' }];

        onReadable();

        const state = await executeQuery(PROJECTION_NAME);

        expect(state).to.be.deep.equal({
            value: 42
        });
    });

    it('should handle broken event', async () => {
        const executeQuery = createQueryExecutor({ eventStore, projections });
        eventList = [{ type: 'BrokenEvent' }];

        onReadable();

        try {
            await executeQuery(PROJECTION_NAME);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error).to.be.equal(brokenStateError);
        }
    });

    it('should handle errors on read side', async () => {
        const readSideError = new Error('Read side error');
        const executeQuery = createQueryExecutor({ eventStore, projections });
        eventList = [{ type: 'BrokenEvent' }];

        onError(readSideError);

        try {
            await executeQuery(PROJECTION_NAME);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error).to.be.equal(readSideError);
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
