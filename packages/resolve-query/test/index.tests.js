import { expect } from 'chai';
import sinon from 'sinon';
import createExecutor from '../src';

const events = [
    { __type: 'SUM', value: 1 },
    { __type: 'SUM', value: 2 },
    { __type: 'SUB', value: 1 },
    { __type: 'SUB', value: 1 },
    { __type: 'SUM', value: 2 }
];

const newEvent = {
    __type: 'SUM',
    value: 1
};

const initialState = {
    count: 0
};

const handlers = {
    SUM: (state, event) => ({ count: state.count + event.value }),
    SUB: (state, event) => ({ count: state.count - event.value })
};

let onEventCallback = null;

const options = {
    eventStore: {
        loadEventsByTypes: sinon.spy((types, cb) => Promise.resolve(events.forEach(cb)))
    },
    projection: {
        initialState,
        handlers
    },
    eventBus: {
        emitEvent: (event) => {
            onEventCallback(event);
        },
        onEvent: (eventTypes, callback) => (onEventCallback = callback)
    }
};

describe('resolve-query', () => {
    afterEach(() => {
        options.eventStore.loadEventsByTypes.reset();
    });

    it('execute', () => {
        const execute = createExecutor(options);
        return execute().then((result) => {
            expect(result).to.be.deep.equal({ count: 3 });
        });
    });

    it('initial call once', () => {
        let execute = createExecutor(options);
        execute = createExecutor(options);
        return execute().then(() => {
            expect(options.eventStore.loadEventsByTypes.callCount).to.be.equal(1);
        });
    });

    it('eventbus onEvent', () => {
        const execute = createExecutor(options);
        return execute().then(() => {
            options.eventBus.emitEvent(newEvent);
            return execute().then((result) => {
                expect(result).to.be.deep.equal({ count: 4 });
            });
        });
    });
});
