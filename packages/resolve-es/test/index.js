/* eslint no-unused-expressions: 0 */
import { expect } from 'chai';
import stream from 'stream';
import sinon from 'sinon';
import uuidV4 from 'uuid/v4';
import createEventStore from '../src/index';

describe('resolve-es', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        sandbox.stub(stream, 'Readable').returns({
            push: sinon.spy(),
            emit: sinon.spy()
        });
        sandbox.stub(stream, 'Writable').callsFake(({ write }) => ({ write }));
    });

    afterEach(() => {
        sandbox.restore();
    });

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
});
