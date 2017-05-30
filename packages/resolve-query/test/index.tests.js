import { expect } from 'chai';
import sinon from 'sinon';

import createQueryExecutor from '../src';
const brokenStateError = new Error('Broken Error');

describe('resolve-command', () => {
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

    it('should build state on valid event and return it on query', () => {
        const executeQuery = createQueryExecutor({ eventStore, projections });
        eventList = [{ type: 'SuccessEvent' }];

        onReadable();

        const state = executeQuery(PROJECTION_NAME);

        expect(state).to.be.deep.equal({
            value: 42
        });
    });

    it('should handle broken event', () => {
        const executeQuery = createQueryExecutor({ eventStore, projections });
        eventList = [{ type: 'BrokenEvent' }];

        onReadable();

        expect(() => executeQuery(PROJECTION_NAME)).to.throw(brokenStateError);
    });

    it('should handle errors on read side', () => {
        const readSideError = new Error('Read side error');
        const executeQuery = createQueryExecutor({ eventStore, projections });
        eventList = [{ type: 'BrokenEvent' }];

        onError(readSideError);

        expect(() => executeQuery(PROJECTION_NAME)).to.throw(readSideError);
    });

    it('should handle non-existing query executor', () => {
        const executeQuery = createQueryExecutor({ eventStore, projections });
        eventList = [{ type: 'BrokenEvent' }];

        expect(() => executeQuery('WRONG_PROJECTION_NAME')).to.throw(
            'The \'WRONG_PROJECTION_NAME\' projection is not found'
        );
    });
});
