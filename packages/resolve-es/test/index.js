/* eslint no-unused-expressions: 0 */
import { expect } from 'chai';
import sinon from 'sinon';
import uuidV4 from 'uuid/v4';
import createEventStore from '../src/index';

describe('resolve-es', () => {
    describe('subscribeByEventType', () => {
        // eslint-disable-next-line max-len
        it('should handle callback by eventTypes with events propagated from storage and bus', async () => {
            const resolvedPromise = Promise.resolve();

            const emittedEvent = { type: 'EMITTED_EVENT' };

            const storage = {
                loadEventsByTypes: sinon.stub().callsFake((eventTypes, callback) => {
                    callback(emittedEvent);
                    return resolvedPromise;
                })
            };
            const bus = {
                subscribe: sinon.stub()
            };

            const eventStore = createEventStore({ storage, bus });

            const eventTypes = ['CREATE_TODO', 'REMOVE_TODO'];
            const eventHandler = sinon.stub();
            eventStore.subscribeByEventType(eventTypes, eventHandler);

            await resolvedPromise;

            expect(storage.loadEventsByTypes.calledWith(eventTypes)).to.be.true;
            expect(eventHandler.calledWith(emittedEvent)).to.be.true;
            expect(bus.subscribe.calledOnce).to.be.true;
        });
    });

    describe('subscribeByAggregateId', () => {
        // eslint-disable-next-line max-len
        it('should handle callback by one AggragateId with events propagated from storage and bus', async () => {
            const resolvedPromise = Promise.resolve();

            const aggregateId = 'TEST-AGGREGATE-ID';
            const emittedEvent = { aggregateId };

            const storage = {
                loadEventsByAggregateId: sinon.stub().callsFake((aggregateId, callback) => {
                    callback(emittedEvent);
                    return resolvedPromise;
                })
            };
            const bus = {
                subscribe: sinon.stub()
            };

            const eventStore = createEventStore({ storage, bus });

            const eventHandler = sinon.stub();
            eventStore.subscribeByAggregateId(aggregateId, eventHandler);

            await resolvedPromise;

            expect(storage.loadEventsByAggregateId.lastCall.args[0][0]).to.be.equal(aggregateId);
            expect(eventHandler.calledWith(emittedEvent)).to.be.true;
            expect(bus.subscribe.calledOnce).to.be.true;
        });

        // eslint-disable-next-line max-len
        it('should handle callback by AggragateId array with events propagated from storage and bus', async () => {
            const resolvedPromise = Promise.resolve();

            const aggregateIds = ['TEST-AGGREGATE-ID-1', 'TEST-AGGREGATE-ID-2'];
            const emittedEvent = { aggregateId: aggregateIds[0] };

            const storage = {
                loadEventsByAggregateId: sinon.stub().callsFake((aggregateId, callback) => {
                    callback(emittedEvent);
                    return resolvedPromise;
                })
            };
            const bus = {
                subscribe: sinon.stub()
            };

            const eventStore = createEventStore({ storage, bus });

            const eventHandler = sinon.stub();
            eventStore.subscribeByAggregateId(aggregateIds, eventHandler);

            await resolvedPromise;

            expect(storage.loadEventsByAggregateId.lastCall.args[0]).to.be.equal(aggregateIds);
            expect(eventHandler.calledWith(emittedEvent)).to.be.true;
            expect(bus.subscribe.calledOnce).to.be.true;
        });
    });

    describe('getEventsByAggregateId', async () => {
        // eslint-disable-next-line max-len
        it('should handle events by aggregateId with events propagated from storage', async () => {
            const resolvedPromise = Promise.resolve();

            const emittedEvent = { type: 'EMITTED_EVENT' };

            const storage = {
                loadEventsByAggregateId: sinon.stub().callsFake((aggregateId, callback) => {
                    callback(emittedEvent);
                    return resolvedPromise;
                })
            };
            const bus = { subscribe: sinon.stub() };

            const eventStore = createEventStore({ storage, bus });

            const aggregateId = uuidV4();
            const handler = sinon.stub();
            eventStore.getEventsByAggregateId(aggregateId, handler);

            await resolvedPromise;

            expect(storage.loadEventsByAggregateId.lastCall.args[0][0]).to.be.equal(aggregateId);
            expect(handler.calledWith(emittedEvent)).to.be.true;
        });
    });

    describe('saveEvent', () => {
        it('should save and propagate event', async () => {
            const storage = {
                saveEvent: sinon.stub().returns(Promise.resolve())
            };
            const bus = {
                subscribe: sinon.stub(),
                publish: sinon.stub().returns(Promise.resolve())
            };

            const eventStore = createEventStore({ storage, bus });
            const event = { type: 'EVENT' };
            await eventStore.saveEvent(event);

            expect(storage.saveEvent.calledWith(event)).to.be.true;
            expect(bus.publish.calledWith(event)).to.be.true;
        });
    });
    describe('onEvent', () => {
        const testEvent = {
            type: 'TestEvent',
            payload: true
        };

        let bus;
        beforeEach(() => {
            let busHandler;
            bus = {
                subscribe: callback => (busHandler = callback),
                publish: event => busHandler(event)
            };
        });

        it('should subscibe on bus events by type array', async () => {
            const eventHandler = sinon.stub();
            const eventStore = createEventStore({ bus });
            eventStore.onEvent(['TestEvent'], eventHandler);

            bus.publish({ type: 'WrongName' });
            bus.publish(testEvent);

            expect(eventHandler.calledOnce).to.be.true;
            expect(eventHandler.lastCall.args[0]).to.be.deep.equal(testEvent);
        });

        it('should subscibe on bus events by type and id descriptor object', async () => {
            const eventHandler = sinon.stub();
            const eventStore = createEventStore({ bus });
            eventStore.onEvent({ types: ['SomeType'], ids: ['some-id'] }, eventHandler);

            const events = [
                { type: 'SomeType', aggregateId: 'some-id' },
                { type: 'SomeType', aggregateId: 'another-id' },
                { type: 'AnotherType', aggregateId: 'some-id' },
                { type: 'WrongName' }
            ];

            bus.publish(events[0]);
            bus.publish(events[1]);
            bus.publish(events[2]);
            bus.publish(events[3]);

            expect(eventHandler.callCount).to.be.equal(4);
            expect(eventHandler.getCall(0).args[0]).to.be.deep.equal(events[0]);
            expect(eventHandler.getCall(1).args[0]).to.be.deep.equal(events[0]);
            expect(eventHandler.getCall(2).args[0]).to.be.deep.equal(events[1]);
            expect(eventHandler.getCall(3).args[0]).to.be.deep.equal(events[2]);
        });

        it('should return unsubscribe function', async () => {
            const eventHandler = sinon.stub();

            const eventStore = createEventStore({ bus });
            const unsubscribe = await eventStore.onEvent(['TestEvent'], eventHandler);

            bus.publish(testEvent);
            unsubscribe();
            bus.publish(testEvent);

            expect(eventHandler.calledOnce).to.be.true;
        });
    });
    it('onError', async () => {
        const loadEventsByTypesError = new Error('LoadEventsByTypes error');
        const loadEventsByAggregateIdError = new Error('LoadEventsByAggregateId error');
        const saveEventError = new Error('SaveEvent error');

        const storage = {
            loadEventsByTypes: () => {
                throw loadEventsByTypesError;
            },
            loadEventsByAggregateId: () => {
                throw loadEventsByAggregateIdError;
            },
            saveEvent: () => {
                throw saveEventError;
            }
        };
        const bus = {
            subscribe: sinon.stub()
        };
        const errorHandler = sinon.stub();
        const eventStore = createEventStore({ storage, bus }, errorHandler);

        await eventStore.subscribeByEventType();
        await eventStore.getEventsByAggregateId();
        await eventStore.saveEvent();

        expect(errorHandler.callCount).to.be.equal(3);

        expect(errorHandler.firstCall.args[0]).to.be.equal(loadEventsByTypesError);
        expect(errorHandler.secondCall.args[0]).to.be.equal(loadEventsByAggregateIdError);
        expect(errorHandler.lastCall.args[0]).to.be.equal(saveEventError);
    });
});
