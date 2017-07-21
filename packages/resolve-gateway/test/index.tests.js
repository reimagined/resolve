import { expect } from 'chai';
import sinon from 'sinon';

import createGatewayExecutor from '../src';
const brokenStateError = new Error('Broken Error');

describe('resolve-gateway', () => {
    const PROJECTION_NAME = 'projectionName';

    let eventStore, eventList;

    const gateways = [
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
                })
            }
        }
    ];

    beforeEach(() => {
        eventList = [];

        eventStore = {
            subscribeByEventType: sinon.stub().callsFake((eventTypes, handler) =>
                new Promise(resolve => resolve(handler(eventList.shift())))
            ),

            saveEvent: sinon.stub().callsFake(event => {
                console.log('###SAVE EVENT:', event);
                return new Promise(resolve => resolve(eventList.push(event)))
                    .then(() => console.log('###EVENT LIST', eventList))
            }

            )
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

        expect(eventList).to.be.deep.equal([
            { type: 'SyncStateEvent', payload: { value: 2 } }
        ]);
    });

    it.only('execute one gateway at one time', async () => {
        let resolveGateway1;
        const gatewayPromise1 = new Promise(resolve => (resolveGateway1 = resolve));
        let resolveGateway2;
        const gatewayPromise2 = new Promise(resolve => (resolveGateway2 = resolve));
        gateways.push({
            initialState: {},
            name: 'Test1',
            eventHandlers: {
                SuccessEvent: (state, event) => {
                    return { ...state, value: 1 };
                }
            },
            execute: (state, emitEvent) => {
                return gatewayPromise1.then(() => emitEvent({
                    type: 'SyncTestEvent',
                    payload: 'test event1'
                }))
            }
        }, {
            initialState: {},
            name: 'Test2',
            eventHandlers: {
                SuccessEvent: (state, event) => {
                    return { ...state, value: 1 };
                }
            },
            execute: (state, emitEvent) => {
                return gatewayPromise2.then(() => emitEvent({
                    type: 'SyncTestEvent',
                    payload: 'test event2'
                }))
            }
        });

        const executeGateway = createGatewayExecutor({ eventStore, gateways });
        eventList = [
            { type: 'SuccessEvent' },
            { type: 'SuccessEvent' }
        ];

        executeGateway('Test1');
        executeGateway('Test2');

        resolveGateway2();
        await gatewayPromise2;

        await Promise.resolve();
        await Promise.resolve();

        expect(eventList).to.be.deep.equal([]);

        resolveGateway1();
        await gatewayPromise1;

        await Promise.resolve();
        await Promise.resolve();

        expect(eventList).to.be.deep.equal([
            { type: 'SyncTestEvent', payload: 'test event2' },
            { type: 'SyncTestEvent', payload: 'test event1' }
        ]);
    });

    it.only('sync', async () => {
        const clock = sinon.useFakeTimers();

        gateways.push({
            initialState: {},
            name: 'Async',
            eventHandlers: {
                SuccessEvent: (state, event) => {
                    return { ...state, value: state.value + 1 };
                },
                SyncStateEvent: (state, event) => {
                    return { ...state, value: 1 };
                }
            },
            execute: (state, emitEvent) => {
                return new Promise(resolve => setTimeout(() => {
                    emitEvent({
                        type: 'SyncStateEvent',
                        payload: { ...state, value: state.value * 2 }
                    }).then(resolve);
                }, 1000))
            }
        })

        const executeGateway = createGatewayExecutor({ eventStore, gateways });
        eventList = [{ type: 'SuccessEvent' }];

        const firstExecute = executeGateway('Async');
        const secondExecute = executeGateway('Async');

        clock.tick(2000);

        await Promise.resolve();
        await Promise.resolve();


        expect(eventList).to.be.deep.equal([
            { type: 'SyncStateEvent', payload: { value: 2 } }
        ]);
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
});
