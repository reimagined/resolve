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

        // eslint-disable-next-line max-len
        it('should handle callback by eventTypes with events propagated only from bus', async () => {
            const resolvedPromise = Promise.resolve();

            const storage = { loadEventsByTypes: sinon.stub() };
            const bus = { subscribe: sinon.stub() };

            const eventStore = createEventStore({ storage, bus });

            const eventTypes = ['CREATE_TODO', 'REMOVE_TODO'];
            const eventHandler = sinon.stub();
            eventStore.subscribeByEventType(eventTypes, eventHandler, true);

            await resolvedPromise;

            expect(storage.loadEventsByTypes.notCalled).to.be.true;
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
                loadEventsByAggregateIds: sinon.stub().callsFake((aggregateId, callback) => {
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

            expect(storage.loadEventsByAggregateIds.lastCall.args[0][0]).to.be.equal(aggregateId);
            expect(eventHandler.calledWith(emittedEvent)).to.be.true;
            expect(bus.subscribe.calledOnce).to.be.true;
        });

        // eslint-disable-next-line max-len
        it('should handle callback by AggragateId array with events propagated from storage and bus', async () => {
            const resolvedPromise = Promise.resolve();

            const aggregateIds = ['TEST-AGGREGATE-ID-1', 'TEST-AGGREGATE-ID-2'];
            const emittedEvent = { aggregateId: aggregateIds[0] };

            const storage = {
                loadEventsByAggregateIds: sinon.stub().callsFake((aggregateId, callback) => {
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

            expect(storage.loadEventsByAggregateIds.lastCall.args[0]).to.be.equal(aggregateIds);
            expect(eventHandler.calledWith(emittedEvent)).to.be.true;
            expect(bus.subscribe.calledOnce).to.be.true;
        });

        // eslint-disable-next-line max-len
        it('should handle callback by AggragateId array with events propagated only from bus', async () => {
            const resolvedPromise = Promise.resolve();

            const storage = { loadEventsByAggregateIds: sinon.stub() };
            const bus = { subscribe: sinon.stub() };

            const eventStore = createEventStore({ storage, bus });

            const eventTypes = ['CREATE_TODO', 'REMOVE_TODO'];
            const eventHandler = sinon.stub();
            eventStore.subscribeByAggregateId(eventTypes, eventHandler, true);

            await resolvedPromise;

            expect(storage.loadEventsByAggregateIds.notCalled).to.be.true;
            expect(bus.subscribe.calledOnce).to.be.true;
        });
    });

    describe('getEventsByAggregateId', async () => {
        // eslint-disable-next-line max-len
        it('should handle events by aggregateId with events propagated from storage', async () => {
            const resolvedPromise = Promise.resolve();

            const emittedEvent = { type: 'EMITTED_EVENT' };

            const storage = {
                loadEventsByAggregateIds: sinon.stub().callsFake((aggregateId, callback) => {
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

            expect(storage.loadEventsByAggregateIds.lastCall.args[0][0]).to.be.equal(aggregateId);
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
            const event = { type: 'EVENT', aggregateId: 'ID' };
            await eventStore.saveEvent(event);

            expect(storage.saveEvent.calledWith(event)).to.be.true;
            expect(bus.publish.calledWith(event)).to.be.true;
        });

        it('should reject events without type', async () => {
            const storage = {
                saveEvent: sinon.stub().returns(Promise.resolve())
            };
            const bus = {
                subscribe: sinon.stub(),
                publish: sinon.stub().returns(Promise.resolve())
            };

            const eventStore = createEventStore({ storage, bus });
            const event = { aggregateId: 'ID' };

            try {
                await eventStore.saveEvent(event);
                return Promise.reject('Test failed');
            } catch (err) {
                expect(err.message).to.be.equal(
                    'Some of event mandatory fields (type, aggregateId) are missed'
                );
            }
        });

        it('should reject events without aggregateId', async () => {
            const storage = {
                saveEvent: sinon.stub().returns(Promise.resolve())
            };
            const bus = {
                subscribe: sinon.stub(),
                publish: sinon.stub().returns(Promise.resolve())
            };

            const eventStore = createEventStore({ storage, bus });
            const event = { type: 'EVENT_TYPE' };

            try {
                await eventStore.saveEvent(event);
                return Promise.reject('Test failed');
            } catch (err) {
                expect(err.message).to.be.equal(
                    'Some of event mandatory fields (type, aggregateId) are missed'
                );
            }
        });

        it('should enforce timestamp field in event with actual time', async () => {
            const storage = {
                saveEvent: sinon.stub().returns(Promise.resolve())
            };
            const bus = {
                subscribe: sinon.stub(),
                publish: sinon.stub().returns(Promise.resolve())
            };

            const eventStore = createEventStore({ storage, bus });
            const event = { type: 'EVENT_TYPE', aggregateId: 'ID' };

            const originalDateNow = Date.now;
            Date.now = () => Number.MAX_VALUE;

            const savingPromise = eventStore.saveEvent(event);

            Date.now = originalDateNow;
            await savingPromise;

            expect(event.timestamp).to.be.equal(Number.MAX_VALUE);
        });
    });

    describe('saveEventRaw', () => {
        it('should save and propagate event', async () => {
            const storage = {
                saveEvent: sinon.stub().returns(Promise.resolve())
            };
            const bus = {
                subscribe: sinon.stub(),
                publish: sinon.stub().returns(Promise.resolve())
            };

            const eventStore = createEventStore({ storage, bus });
            const event = { type: 'EVENT', aggregateId: 'ID', timestamp: 100 };
            await eventStore.saveEventRaw(event);

            expect(storage.saveEvent.calledWith(event)).to.be.true;
            expect(bus.publish.calledWith(event)).to.be.true;
        });

        it('should reject events without type / aggregateId / timestamp', async () => {
            const storage = {
                saveEvent: sinon.stub().returns(Promise.resolve())
            };
            const bus = {
                subscribe: sinon.stub(),
                publish: sinon.stub().returns(Promise.resolve())
            };

            const eventStore = createEventStore({ storage, bus });
            const event = {};

            try {
                await eventStore.saveEventRaw(event);
                return Promise.reject('Test failed');
            } catch (err) {
                expect(err.message).to.be.equal(
                    'Some of event mandatory fields (type, aggregateId, timestamp) are missed'
                );
            }
        });

        it('should reject events with malformed timestamp', async () => {
            const storage = {
                saveEvent: sinon.stub().returns(Promise.resolve())
            };
            const bus = {
                subscribe: sinon.stub(),
                publish: sinon.stub().returns(Promise.resolve())
            };

            const eventStore = createEventStore({ storage, bus });
            const event = { type: 'Event_type', aggregateId: 'Id', timestamp: 'Wrong-timestamp' };

            try {
                await eventStore.saveEventRaw(event);
                return Promise.reject('Test failed');
            } catch (err) {
                expect(err.message).to.be.equal(
                    'Some of event mandatory fields (type, aggregateId, timestamp) are missed'
                );
            }
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
            loadEventsByAggregateIds: () => {
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
        await eventStore.saveEvent({
            type: 'TestEvent',
            aggregateId: 'id'
        });

        expect(errorHandler.callCount).to.be.equal(3);

        expect(errorHandler.firstCall.args[0]).to.be.equal(loadEventsByTypesError);
        expect(errorHandler.secondCall.args[0]).to.be.equal(loadEventsByAggregateIdError);
        expect(errorHandler.lastCall.args[0]).to.be.equal(saveEventError);
    });
});
