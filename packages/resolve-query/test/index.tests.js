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

const initialState = () => ({ count: 0 });

const handlers = {
    SUM: (state, event) => ({ count: state.count + event.value }),
    SUB: (state, event) => ({ count: state.count - event.value })
};

const PROJECTION_NAME = 'prj1';

let onEventCallback = null;

const options = {
    store: {
        loadEventsByTypes: sinon.spy((types, cb) => Promise.resolve(events.forEach(cb)))
    },
    projections: {
        [PROJECTION_NAME]: {
            initialState,
            handlers
        }
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
        return execute(PROJECTION_NAME).then((result) => {
            expect(result).to.be.deep.equal({ count: 3 });
        });
    });

    it('initial call once', () => {
        const execute = createExecutor(options);
        return Promise.all([execute(PROJECTION_NAME), execute(PROJECTION_NAME)]).then(() => {
            expect(options.store.loadEventsByTypes.callCount).to.be.equal(1);
        });
    });

    it('eventbus onEvent', () => {
        const execute = createExecutor(options);
        return execute(PROJECTION_NAME).then(() => {
            options.bus.emitEvent({
                __type: 'SUM',
                value: 1
            });
            return execute(PROJECTION_NAME).then((result) => {
                expect(result).to.be.deep.equal({ count: 4 });
            });
        });
    });
});
