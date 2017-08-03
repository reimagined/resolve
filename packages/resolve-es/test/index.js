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
            const listenedEvent = { type: 'LISTENED_EVENT' };

            const storage = {
                loadEventsByTypes: sinon.stub().callsFake((eventTypes, callback) => {
                    callback(emittedEvent);
                    return resolvedPromise;
                })
            };
            const bus = {
                onEvent: sinon.stub().callsFake((eventTypes, callback) => callback(listenedEvent))
            };

            const eventStore = createEventStore({ storage, bus });

            const eventTypes = ['CREATE_TODO', 'REMOVE_TODO'];
            const eventHandler = sinon.stub();
            eventStore.subscribeByEventType(eventTypes, eventHandler);

            await resolvedPromise;

            expect(storage.loadEventsByTypes.calledWith(eventTypes)).to.be.true;
            expect(eventHandler.calledWith(emittedEvent)).to.be.true;
            expect(bus.onEvent.calledWith(eventTypes)).to.be.true;
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
            const bus = {};

            const eventStore = createEventStore({ storage, bus });

            const aggregateId = uuidV4();
            const handler = sinon.stub();
            eventStore.getEventsByAggregateId(aggregateId, handler);

            await resolvedPromise;

            expect(storage.loadEventsByAggregateId.calledWith(aggregateId)).to.be.true;
            expect(handler.calledWith(emittedEvent)).to.be.true;
        });
    });

    describe('saveEvent', () => {
        it('should save and propagate event', async () => {
            const storage = {
                saveEvent: sinon.stub().returns(Promise.resolve())
            };
            const bus = {
                emitEvent: sinon.stub().returns(Promise.resolve())
            };

            const eventStore = createEventStore({ storage, bus });
            const event = { type: 'EVENT' };
            await eventStore.saveEvent(event);

            expect(storage.saveEvent.calledWith(event)).to.be.true;
            expect(bus.emitEvent.calledWith(event)).to.be.true;
        });
    });

    describe('onEvent', () => {
        it('should subscibe on bus events', async () => {
            const noop = () => {};
            const bus = {
                onEvent: sinon.stub()
            };

            const eventStore = createEventStore({ bus });
            eventStore.onEvent('event', noop);

            expect(bus.onEvent.calledWith('event', noop)).to.be.true;
        });
    });

    it('onError', async () => {
        const loadEventsByTypesError = new Error('LoadEventsByTypes error');
        const loadEventsByAggregateIdError = new Error('LoadEventsByAggregateId error');
        const saveEventError = new Error('SaveEvent error');
        const onEventError = new Error('OnEvent error');

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
            onEvent: () => {
                throw onEventError;
            }
        };
        const errorHandler = sinon.stub();
        const eventStore = createEventStore({ storage, bus }, errorHandler);

        await eventStore.subscribeByEventType();
        await eventStore.getEventsByAggregateId();
        await eventStore.onEvent();
        await eventStore.saveEvent();

        expect(errorHandler.callCount).to.be.equal(4);

        expect(errorHandler.firstCall.args[0]).to.be.equal(loadEventsByTypesError);
        expect(errorHandler.secondCall.args[0]).to.be.equal(loadEventsByAggregateIdError);
        expect(errorHandler.thirdCall.args[0]).to.be.equal(onEventError);
        expect(errorHandler.lastCall.args[0]).to.be.equal(saveEventError);
    });
});
