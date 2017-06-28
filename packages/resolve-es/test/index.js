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

    describe('getPublishStream', () => {
        it('should return eventStream for publish and call write and propagate event', async () => {
            const storage = {
                saveEvent: sinon.stub().returns(Promise.resolve())
            };
            const bus = {
                emitEvent: sinon.stub().returns(Promise.resolve())
            };

            const eventStore = createEventStore({ storage, bus });
            const eventStream = eventStore.getPublishStream();

            const event = { type: 'EVENT' };
            const callback = sinon.spy();

            await eventStream.write(event, '', callback);

            await Promise.resolve();

            expect(storage.saveEvent.calledWith(event)).to.be.true;
            expect(bus.emitEvent.calledWith(event)).to.be.true;
            expect(callback.calledWith()).to.be.true;
        });

        it('should return eventStream for publish and call write and raises error', async () => {
            const error = new Error('Error');

            const storage = {
                saveEvent: sinon.stub().callsFake(() => Promise.reject(error))
            };
            const bus = {
                emitEvent: sinon.stub().callsFake(() => Promise.reject(error))
            };

            const eventStore = createEventStore({ storage, bus });
            const eventStream = eventStore.getPublishStream();

            const event = { type: 'EVENT' };
            const callback = sinon.spy();

            try {
                await eventStream.write(event, '', callback);
            } catch (err) {
                expect(callback.calledWith(error)).to.be.true;
            }
        });
    });
});
