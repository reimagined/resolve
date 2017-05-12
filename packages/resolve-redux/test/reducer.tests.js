import Immutable from 'seamless-immutable';
import uuidV4 from 'uuid/v4';
import { expect } from 'chai';
import reducer from '../src/reducer';
import ResolveActions from '../src/actions';

describe('reducer', () => {
    const projection = {
        name: 'counter',

        initialState: () => Immutable({}),

        eventHandlers: {
            COUNTER_CREATE: (state, event) => state.set(event.aggregateId, { value: 0 }),
            COUNTER_INCREMENT: (state, event) =>
                state.update(event.aggregateId, counter => counter.set('value', counter.value + 1)),
            COUNTER_DECREMENT: (state, event) =>
                state.update(event.aggregateId, counter => counter.set('value', counter.value - 1))
        }
    };

    let _reducer;

    it('should return reducer by projection', () => {
        _reducer = reducer(projection);

        let state = _reducer(undefined, { type: '@@INIT' });
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

        const prevState = state;
        state = _reducer(state, { type: 'OTHER_EVENT' });
        expect(state).to.equal(prevState);
    });

    it('merge state', () => {
        const aggregateId1 = uuidV4();
        const aggregateId2 = uuidV4();
        const aggregateId3 = uuidV4();

        let state = Immutable({
            [aggregateId1]: { value: 1 },
            [aggregateId2]: { value: 2 },
            [aggregateId3]: { value: 3 }
        });

        state = _reducer(
            state,
            ResolveActions.merge('counter', {
                [aggregateId1]: { value: 5 },
                [aggregateId3]: { value: 4 }
            })
        );

        expect(state).to.deep.equal({
            [aggregateId1]: { value: 5 },
            [aggregateId2]: { value: 2 },
            [aggregateId3]: { value: 4 }
        });
    });
});
