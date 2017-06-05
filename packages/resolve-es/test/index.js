/* eslint no-unused-expressions: 0 */
import { expect } from 'chai';
import stream, { Transform } from 'stream';
import sinon from 'sinon';
import uuidV4 from 'uuid/v4';
import createEventStore from '../src/index';

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

describe('resolve-es', () => {
    describe('getStreamByEventTypes', () => {
        // eslint-disable-next-line max-len
        it('should return eventStream by eventTypes with events propagated from storage and bus', async () => {
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
            const eventStream = eventStore.getStreamByEventTypes(eventTypes);

            await resolvedPromise;

            expect(storage.loadEventsByTypes.calledWith(eventTypes)).to.be.true;
            expect(eventStream.push.calledWith(emittedEvent)).to.be.true;

            await Promise.resolve();
            expect(bus.onEvent.calledWith(eventTypes)).to.be.true;
            expect(eventStream.push.calledWith(listenedEvent)).to.be.true;
        });

        it('should return eventStream by eventTypes with raised error', async () => {
            const error = new Error('Error');
            const rejectedPromise = Promise.reject(error);

            const emittedEvent = { type: 'EMITTED_EVENT' };

            const storage = {
                loadEventsByTypes: sinon.stub().callsFake((eventTypes, callback) => {
                    callback(emittedEvent);
                    return rejectedPromise;
                })
            };
            const bus = {};

            const eventStore = createEventStore({ storage, bus });

            const eventTypes = ['CREATE_TODO', 'REMOVE_TODO'];
            const eventStream = eventStore.getStreamByEventTypes(eventTypes);

            try {
                await rejectedPromise;
                return Promise.reject('Test failed');
            } catch (error) {
                expect(storage.loadEventsByTypes.calledWith(eventTypes)).to.be.true;
                expect(eventStream.push.calledWith(emittedEvent)).to.be.true;

                await Promise.resolve();
                expect(eventStream.emit.calledWith('error', error)).to.be.true;
            }
        });

        it('should return eventStream with transformed events', async () => {
            sandbox.restore();

            const storageEvents = [{ type: 'FIRST_EVENT' }, { type: 'SECOND_EVENT' }];
            const busEvents = [{ type: 'THIRD_EVENT' }, { type: 'FOURTH_EVENT' }];

            const storage = {
                loadEventsByTypes: async (_, callback) => {
                    storageEvents.forEach(event => callback(event));
                }
            };

            const bus = {
                onEvent: (_, callback) => busEvents.forEach(event => callback(event))
            };

            const transforms = [
                new Transform({
                    objectMode: true,
                    transform(event, encoding, callback) {
                        event.isTransformed = true;
                        this.push(event);
                        callback();
                    }
                })
            ];

            const eventStore = createEventStore({ storage, bus, transforms });

            const eventStream = eventStore.getStreamByEventTypes();

            const resultEvents = [];
            eventStream.on('readable', () => {
                let event;
                // eslint-disable-next-line no-cond-assign
                while (null !== (event = eventStream.read())) {
                    resultEvents.push(event);
                }
            });

            await Promise.resolve();

            expect(resultEvents).to.deep.equal([
                { type: 'FIRST_EVENT', isTransformed: true },
                { type: 'SECOND_EVENT', isTransformed: true },
                { type: 'THIRD_EVENT', isTransformed: true },
                { type: 'FOURTH_EVENT', isTransformed: true }
            ]);
        });
    });

    describe('getStreamByAggregateId', () => {
        // eslint-disable-next-line max-len
        it('should return eventStream by aggregateId with events propagated from storage', async () => {
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
            const eventStream = eventStore.getStreamByAggregateId(aggregateId);

            await resolvedPromise;

            expect(storage.loadEventsByAggregateId.calledWith(aggregateId)).to.be.true;
            expect(eventStream.push.calledWith(emittedEvent)).to.be.true;

            await Promise.resolve();
            expect(eventStream.push.calledWith(null)).to.be.true;
        });

        // eslint-disable-next-line max-len
        it('should return eventStream by aggregateId with events propagated from storage', async () => {
            const error = new Error('Error');
            const rejectedPromise = Promise.reject(error);

            const emittedEvent = { type: 'EMITTED_EVENT' };

            const storage = {
                loadEventsByAggregateId: sinon.stub().callsFake((aggregateId, callback) => {
                    callback(emittedEvent);
                    return rejectedPromise;
                })
            };
            const bus = {};

            const eventStore = createEventStore({ storage, bus });

            const aggregateId = uuidV4();
            const eventStream = eventStore.getStreamByAggregateId(aggregateId);

            try {
                await rejectedPromise;
                return Promise.reject('Test failed');
            } catch (err) {
                expect(storage.loadEventsByAggregateId.calledWith(aggregateId)).to.be.true;
                expect(eventStream.push.calledWith(emittedEvent)).to.be.true;

                await Promise.resolve();
                expect(eventStream.emit.calledWith('error', error));
            }
        });

        it('should return eventStream with transformed events', async () => {
            sandbox.restore();

            const aggregateId = 'aggregateId';

            const storageEvents = [
                { type: 'FIRST_EVENT', aggregateId },
                { type: 'SECOND_EVENT', aggregateId }
            ];

            const storage = {
                loadEventsByAggregateId: async (_, callback) => {
                    storageEvents.forEach(event => callback(event));
                }
            };

            const transforms = [
                new Transform({
                    objectMode: true,
                    transform(event, encoding, callback) {
                        event.isTransformed = true;
                        this.push(event);
                        callback();
                    }
                })
            ];

            const eventStore = createEventStore({ storage, transforms });

            const eventStream = eventStore.getStreamByAggregateId(aggregateId);

            const resultEvents = [];
            eventStream.on('readable', () => {
                let event;
                // eslint-disable-next-line no-cond-assign
                while (null !== (event = eventStream.read())) {
                    resultEvents.push(event);
                }
            });

            await Promise.resolve();

            expect(resultEvents).to.deep.equal([
                { type: 'FIRST_EVENT', aggregateId, isTransformed: true },
                { type: 'SECOND_EVENT', aggregateId, isTransformed: true }
            ]);
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
