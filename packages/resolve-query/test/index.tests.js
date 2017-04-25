import { expect } from 'chai';
import createExecutor from '../src';

const events = [
    { __type: 'SUM', value: 1 },
    { __type: 'SUM', value: 2 },
    { __type: 'SUB', value: 1 },
    { __type: 'SUB', value: 1 },
    { __type: 'SUM', value: 2 }
];

const initialState = {
    count: 0
};

const handlers = {
    SUM: (state, event) => ({ count: state.count + event.value }),
    SUB: (state, event) => ({ count: state.count - event.value })
};

const execute = createExecutor({
    eventStore: {
        loadEventsByTypes: (types, cb) => Promise.resolve(events.forEach(cb))
    },
    projection: {
        initialState,
        handlers
    }
});

describe('resolve-query', () => {
    it('execute', () => execute().then((result) => {
        expect(result).to.be.deep.equal({ count: 3 });
    }));
});
