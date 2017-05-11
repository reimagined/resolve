import Immutable from 'seamless-immutable';
import uuidV4 from 'uuid/v4';
import { expect } from 'chai';
import reducer from '../src/reducer';

describe('resolve-redux', () => {
    describe('reducer', () => {
        it('should return reducer by projection', () => {
            const projection = {
                initialState: () => Immutable({}),

                eventHandlers: {
                    COUNTER_CREATE: (state, event) => state.set(event.aggregateId, { value: 0 }),
                    COUNTER_INCREMENT: (state, event) =>
                        state.update(event.aggregateId, counter =>
                            counter.set('value', counter.value + 1)
                        ),
                    COUNTER_DECREMENT: (state, event) =>
                        state.update(event.aggregateId, counter =>
                            counter.set('value', counter.value - 1)
                        )
                }
            };

            const _reducer = reducer(projection, 'counter');

            let state = _reducer(undefined, '@@INIT');
            expect(state).to.deep.equal(projection.initialState());

            const aggregateId = uuidV4();

            state = _reducer(state, {
                type: 'COUNTER_CREATE',
                aggregateId
            });
            expect(state).to.deep.equal({
                [aggregateId]: { value: 0 }
            });
            state = _reducer(state, {
                type: 'COUNTER_INCREMENT',
                aggregateId
            });
            expect(state).to.deep.equal({
                [aggregateId]: { value: 1 }
            });
            state = _reducer(state, {
                type: 'COUNTER_DECREMENT',
                aggregateId
            });
            expect(state).to.deep.equal({
                [aggregateId]: { value: 0 }
            });
        });
    });
});
