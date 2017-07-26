import { expect } from 'chai';
import sinon from 'sinon';

import createGatewayExecutor from '../src';
const brokenStateError = new Error('Broken Error');

describe('resolve-gateway', () => {
    const PROJECTION_NAME = 'projectionName';

    let eventStore, eventList, gateways;

    beforeEach(() => {
        gateways = [
            {
                initialState: {},
                name: PROJECTION_NAME,
                eventHandlers: {
                    SuccessEvent: (state, event) => {
                        return { ...state, value: 1 };
                    },
                    BrokenEvent: (state, event) => {
                        throw brokenStateError;
                    }
                },
                execute: (state, emitEvent) => {
                    emitEvent({
                        type: 'SyncStateEvent',
                        payload: { ...state, value: state.value * 2 }
                    });
                }
            }
        ];
        eventList = [];

        eventStore = {
            subscribeByEventType: sinon
                .stub()
                .callsFake(
                    (eventTypes, handler) =>
                        new Promise(resolve => resolve(handler(eventList.shift())))
                ),

            saveEvent: sinon
                .stub()
                .callsFake(event => new Promise(resolve => resolve(eventList.push(event))))
        };
    });

    afterEach(() => {
        eventStore = null;
        eventList = null;
    });

    it('should build state on valid event and execute sync function', async () => {
        const executeGateway = createGatewayExecutor({ eventStore, gateways });
        eventList = [{ type: 'SuccessEvent' }];

        await executeGateway(PROJECTION_NAME);

        expect(eventList).to.be.deep.equal([{ type: 'SyncStateEvent', payload: { value: 2 } }]);
    });

    it('should handle broken event', async () => {
        const executeQuery = createGatewayExecutor({ eventStore, gateways });
        eventList = [{ type: 'BrokenEvent' }];

        try {
            await executeQuery(PROJECTION_NAME);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error).to.be.equal(brokenStateError);
        }
    });

    it('should handle errors on read side', async () => {
        const readSideError = new Error('Broken Error');
        const executeQuery = createGatewayExecutor({ eventStore, gateways });
        eventList = [{ type: 'BrokenEvent' }];

        try {
            await executeQuery(PROJECTION_NAME);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error).to.be.deep.equal(readSideError);
        }
    });

    it('should handle errors on read side taking by bus', async () => {
        let eventHandler;
        const readSideError = new Error('Broken Error');

        eventStore.subscribeByEventType = sinon.stub().callsFake((eventTypes, handler) => {
            eventHandler = handler;
            return handler(eventList.shift());
        });
        eventList = [{ type: 'SuccessEvent' }, { type: 'SuccessEvent' }];
        const executeQuery = createGatewayExecutor({ eventStore, gateways });
        await executeQuery(PROJECTION_NAME);

        eventHandler({ type: 'BrokenEvent' });

        try {
            await executeQuery(PROJECTION_NAME);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error).to.be.deep.equal(readSideError);
        }
    });

    it('should handle non-existing gateway executor', async () => {
        const executeQuery = createGatewayExecutor({ eventStore, gateways });
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

    describe.only('parallel execution', () => {
        let doneAsync1, doneAsync2;

        beforeEach(() => {
            doneAsync2 = doneAsync1 = () => {};

            gateways = [
                {
                    initialState: {},
                    name: 'Async1',
                    eventHandlers: {
                        SuccessEvent: (state, event) => {
                            return { ...state, value: 1 };
                        },
                        SyncStateEvent: (state, event) => {
                            return { ...state, value: 1 };
                        }
                    },
                    execute: (state, emitEvent) => {
                        return emitEvent({
                            type: 'SyncStateEvent',
                            payload: { ...state, value: (state.value || 1) * 2 }
                        }).then(doneAsync1);
                    }
                },
                {
                    initialState: {},
                    name: 'Async2',
                    eventHandlers: {
                        SuccessEvent: (state, event) => {
                            return { ...state, value: 1 };
                        },
                        SyncStateEvent: (state, event) => {
                            return { ...state, value: 1 };
                        }
                    },
                    execute: (state, emitEvent) => {
                        return emitEvent({
                            type: 'SyncStateEvent',
                            payload: { ...state, value: 'async2' }
                        }).then(doneAsync2);
                    }
                }
            ];

            eventList = [{ type: 'SuccessEvent' }];

            eventStore = {
                subscribeByEventType: sinon
                    .stub()
                    .callsFake(
                        (eventTypes, handler) =>
                            new Promise(resolve =>
                                resolve(handler(eventList[eventList.length - 1]))
                            )
                    ),

                saveEvent: sinon
                    .stub()
                    .callsFake(event => new Promise(resolve => resolve(eventList.push(event))))
            };
        });

        it('the same gateway should execute one by one', async () => {
            let resolveGateway1;
            const gatewayPromise1 = new Promise(resolve => (resolveGateway1 = resolve));

            let resolveGateway2;
            const gatewayPromise2 = new Promise(resolve => (resolveGateway2 = resolve));

            let isFirstExecute = true;

            doneAsync1 = () => {
                if (isFirstExecute) {
                    isFirstExecute = false;
                    resolveGateway1();
                } else {
                    resolveGateway2();
                }
            };

            const executeGateway = createGatewayExecutor({ eventStore, gateways });

            executeGateway('Async1');
            executeGateway('Async1');

            await gatewayPromise1;

            expect(eventList).to.be.deep.equal([
                { type: 'SuccessEvent' },
                { type: 'SyncStateEvent', payload: { value: 2 } }
            ]);

            await gatewayPromise2;

            expect(eventList).to.be.deep.equal([
                { type: 'SuccessEvent' },
                { type: 'SyncStateEvent', payload: { value: 2 } },
                { type: 'SyncStateEvent', payload: { value: 2 } }
            ]);
        });

        it('diferent gateways should execute parallel', async () => {
            const gatewayPromise1 = new Promise(resolve => (doneAsync1 = resolve));

            const executeGateway = createGatewayExecutor({ eventStore, gateways });
            executeGateway('Async2');
            executeGateway('Async1');

            await gatewayPromise1;

            expect(eventList).to.be.deep.equal([
                { type: 'SuccessEvent' },
                { type: 'SyncStateEvent', payload: { value: 'async2' } },
                { type: 'SyncStateEvent', payload: { value: 2 } }
            ]);
        });
    });
});
