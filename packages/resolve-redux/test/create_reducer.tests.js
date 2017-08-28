import Immutable from 'seamless-immutable';
import { createStore } from 'redux';
import uuidV4 from 'uuid/v4';
import { expect } from 'chai';
import createReducer from '../src/create_reducer';
import ResolveActions, { MERGE } from '../src/actions';

describe('reducer', () => {
    const readModel = {
        name: 'counter',

        initialState: Immutable({}),

        eventHandlers: {
            COUNTER_CREATE: (state, event) => state.set(event.aggregateId, { value: 0 }),
            COUNTER_INCREMENT: (state, event) =>
                state.update(event.aggregateId, counter => counter.set('value', counter.value + 1)),
            COUNTER_DECREMENT: (state, event) =>
                state.update(event.aggregateId, counter => counter.set('value', counter.value - 1))
        }
    };

    it('should return reducer by readModel', () => {
        const initialState = Immutable({});

        const store = createStore(createReducer(readModel), initialState);

        expect(store.getState()).to.deep.equal(initialState);

        const aggregateId = uuidV4();

        store.dispatch({
            type: 'COUNTER_CREATE',
            aggregateId
        });
        expect(store.getState()).to.deep.equal({
            [aggregateId]: { value: 0 }
        });
        store.dispatch({
            type: 'COUNTER_INCREMENT',
            aggregateId
        });
        expect(store.getState()).to.deep.equal({
            [aggregateId]: { value: 1 }
        });
        store.dispatch({
            type: 'COUNTER_DECREMENT',
            aggregateId
        });
        expect(store.getState()).to.deep.equal({
            [aggregateId]: { value: 0 }
        });

        const prevState = store.getState();
        store.dispatch({ type: 'OTHER_EVENT' });
        expect(store.getState()).to.equal(prevState);
    });

    it('should return reducer by readModel and extend reducer', () => {
        const initialState = Immutable({});

        const extendReducer = (state, action) => {
            switch (action.type) {
                case 'SET_VALUE_42':
                    return state.update(action.aggregateId, item => item.set('value', 42));
                default:
                    return state;
            }
        };

        const store = createStore(createReducer(readModel, extendReducer), initialState);

        expect(store.getState()).to.deep.equal(initialState);

        const aggregateId = uuidV4();

        store.dispatch({
            type: 'COUNTER_CREATE',
            aggregateId
        });
        expect(store.getState()).to.deep.equal({
            [aggregateId]: { value: 0 }
        });
        store.dispatch({
            type: 'COUNTER_INCREMENT',
            aggregateId
        });
        expect(store.getState()).to.deep.equal({
            [aggregateId]: { value: 1 }
        });
        store.dispatch({
            type: 'COUNTER_DECREMENT',
            aggregateId
        });
        expect(store.getState()).to.deep.equal({
            [aggregateId]: { value: 0 }
        });
        store.dispatch({
            type: 'SET_VALUE_42',
            aggregateId
        });
        expect(store.getState()).to.deep.equal({
            [aggregateId]: { value: 42 }
        });

        const prevState = store.getState();
        store.dispatch({ type: 'OTHER_EVENT' });
        expect(store.getState()).to.equal(prevState);
    });

    it('merge state', () => {
        const aggregateId1 = uuidV4();
        const aggregateId2 = uuidV4();
        const aggregateId3 = uuidV4();

        const initialState = Immutable({
            [aggregateId1]: { value: 1 },
            [aggregateId2]: { value: 2 },
            [aggregateId3]: { value: 3 }
        });

        const store = createStore(createReducer(readModel), initialState);

        expect(store.getState()).to.deep.equal(initialState);

        store.dispatch(
            ResolveActions.merge('counter', {
                [aggregateId1]: { value: 5 },
                [aggregateId3]: { value: 4 }
            })
        );

        expect(store.getState()).to.deep.equal({
            [aggregateId1]: { value: 5 },
            [aggregateId2]: { value: 2 },
            [aggregateId3]: { value: 4 }
        });
    });

    it('merge state with custom eventHandler[MERGE]', () => {
        const initialState = new Set();

        const readModel = {
            name: 'set',

            initialState,

            eventHandlers: {
                [MERGE]: (state, action) => {
                    state.add(action.state);
                    return state;
                }
            }
        };

        const store = createStore(createReducer(readModel), initialState);

        expect(store.getState()).to.deep.equal(initialState);

        store.dispatch(ResolveActions.merge('set', 1));
        store.dispatch(ResolveActions.merge('set', 2));
        store.dispatch(ResolveActions.merge('set', 3));
        store.dispatch(ResolveActions.merge('set', 2));

        expect(Array.from(store.getState())).to.deep.equal([1, 2, 3]);
    });

    it('should throw error when initialState=undefined', () => {
        const initialState = undefined;

        const store = createStore(createReducer(readModel), initialState);

        const aggregateId = uuidV4();
        expect(() =>
            store.dispatch({
                type: 'COUNTER_CREATE',
                aggregateId
            })
        ).to.throw();
    });

    it('should support replaceState action', () => {
        const oldState = {};
        const newState = {};

        const store = createStore(createReducer(readModel), oldState);
        store.dispatch(ResolveActions.replaceState('counter', newState));

        expect(store.getState()).to.be.equal(newState);
    });
});
