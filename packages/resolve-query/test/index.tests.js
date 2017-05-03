import { expect } from 'chai';
import sinon from 'sinon';
import createExecutor from '../src';

const events = [
    { type: 'SUM', payload: { value: 1 } },
    { type: 'SUM', payload: { value: 2 } },
    { type: 'SUB', payload: { value: 1 } },
    { type: 'SUB', payload: { value: 1 } },
    { type: 'SUM', payload: { value: 2 } }
];

const initialState = () => ({ count: 0 });

const handlers = {
    SUM: (state, event) => ({ count: state.count + event.payload.value }),
    SUB: (state, event) => ({ count: state.count - event.payload.value })
};

let onEventCallback = null;

const options = {
    store: {
        loadEventsByTypes: sinon.spy((types, cb) => Promise.resolve(events.forEach(cb)))
    },
    projection: {
        initialState,
        handlers
    },
    bus: {
        emitEvent: (event) => {
            onEventCallback(event);
        },
        onEvent: (eventTypes, callback) => (onEventCallback = callback)
    }
};

describe('resolve-query', () => {
    afterEach(() => {
        options.store.loadEventsByTypes.reset();
    });

    it('execute', () => {
        const execute = createExecutor(options);
        return execute().then((result) => {
            expect(result).to.be.deep.equal({ count: 3 });
        });
    });

    it('initial call once', () => {
        const execute = createExecutor(options);
        return Promise.all([execute(), execute()]).then(() => {
            expect(options.store.loadEventsByTypes.callCount).to.be.equal(1);
        });
    });

    it('eventbus onEvent', () => {
        const execute = createExecutor(options);
        return execute().then(() => {
            options.bus.emitEvent({
                type: 'SUM',
                payload: { value: 1 }
            });
            return execute().then((result) => {
                expect(result).to.be.deep.equal({ count: 4 });
            });
        });
    });
});
