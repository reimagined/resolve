/* eslint no-unused-expressions: 0 */
import { expect } from 'chai';
import stream, { Transform } from 'stream';
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

    async function playEvents(eventStream) {
        const resultEvents = [];

        eventStream.on('readable', () => {
            let event;
            // eslint-disable-next-line no-cond-assign
            while (null !== (event = eventStream.read())) {
                resultEvents.push(event);
            }
        });

        return resultEvents;
    }

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

        describe('with transforms', () => {
            let storageEvents, busEvents;

            beforeEach(() => {
                sandbox.restore();
                storageEvents = [];
                busEvents = [];
            });

            const storage = {
                loadEventsByTypes: async (_, callback) => {
                    storageEvents.forEach(event => callback(event));
                }
            };

            const bus = {
                onEvent: (_, callback) => busEvents.forEach(event => callback(event))
            };

            it('should return eventStream with transformed events', async () => {
                storageEvents = [{ type: 'FIRST_EVENT' }, { type: 'SECOND_EVENT' }];
                busEvents = [{ type: 'THIRD_EVENT' }, { type: 'FOURTH_EVENT' }];

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

                const resultEvents = await playEvents(eventStream);

                expect(resultEvents).to.deep.equal([
                    { type: 'FIRST_EVENT', isTransformed: true },
                    { type: 'SECOND_EVENT', isTransformed: true },
                    { type: 'THIRD_EVENT', isTransformed: true },
                    { type: 'FOURTH_EVENT', isTransformed: true }
                ]);
            });

            it('should return eventStream with combined events', async () => {
                const id = uuidV4();
                const name = 'Name';
                const lastName = 'LastName';
                const value = 42;

                storageEvents = [
                    { type: 'CREATE_ITEM', payload: { id } },
                    { type: 'UPDATE_ITEM_NAME', payload: { id, name } },
                    { type: 'UPDATE_ITEM_LAST_NAME', payload: { id, lastName } }
                ];

                busEvents = [
                    { type: 'UPDATE_ITEM_VALUE', payload: { id, value } },
                    { type: 'PUBLISH_ITEM', payload: { id } }
                ];

                const transforms = [
                    ((state = {}) =>
                        new Transform({
                            objectMode: true,
                            transform(event, encoding, callback) {
                                switch (event.type) {
                                    case 'CREATE_ITEM':
                                        state[event.payload.id] = {
                                            id: event.payload.id
                                        };
                                        break;
                                    case 'UPDATE_ITEM_NAME':
                                        state[event.payload.id].name = event.payload.name;
                                        break;
                                    case 'UPDATE_ITEM_LAST_NAME':
                                        state[event.payload.id].lastName = event.payload.lastName;
                                        break;
                                    case 'UPDATE_ITEM_VALUE':
                                        state[event.payload.id].value = event.payload.value;
                                        break;
                                    case 'PUBLISH_ITEM':
                                        this.push({
                                            type: 'CREATE_ITEM_v2',
                                            payload: state[event.payload.id]
                                        });
                                        delete state[event.payload.id];
                                        break;
                                    default:
                                        this.push(event);
                                }
                                callback();
                            }
                        }))()
                ];

                const eventStore = createEventStore({ storage, bus, transforms });

                const eventStream = eventStore.getStreamByEventTypes();

                const resultEvents = await playEvents(eventStream);

                expect(resultEvents).to.deep.equal([
                    {
                        type: 'CREATE_ITEM_v2',
                        payload: {
                            id,
                            name,
                            lastName,
                            value
                        }
                    }
                ]);
            });

            it('should return eventStream with separated events', async () => {
                const id = uuidV4();
                const name = 'Name';
                const lastName = 'LastName';
                const value = 42;

                storageEvents = [
                    { type: 'CREATE_ITEM_v2', payload: { id, name, lastName, value } }
                ];

                const transforms = [
                    new Transform({
                        objectMode: true,
                        transform(event, encoding, callback) {
                            switch (event.type) {
                                case 'CREATE_ITEM_v2':
                                    this.push({
                                        type: 'CREATE_ITEM',
                                        payload: { id: event.payload.id }
                                    });
                                    this.push({
                                        type: 'UPDATE_ITEM_NAME',
                                        payload: { id: event.payload.id, name: event.payload.name }
                                    });
                                    this.push({
                                        type: 'UPDATE_ITEM_LAST_NAME',
                                        payload: {
                                            id: event.payload.id,
                                            lastName: event.payload.lastName
                                        }
                                    });
                                    this.push({
                                        type: 'UPDATE_ITEM_VALUE',
                                        payload: {
                                            id: event.payload.id,
                                            value: event.payload.value
                                        }
                                    });
                                    this.push({
                                        type: 'PUBLISH_ITEM',
                                        payload: { id: event.payload.id }
                                    });
                                    break;
                                default:
                                    this.push(event);
                            }
                            callback();
                        }
                    })
                ];

                const eventStore = createEventStore({ storage, bus, transforms });

                const eventStream = eventStore.getStreamByEventTypes();

                const resultEvents = await playEvents(eventStream);

                expect(resultEvents).to.deep.equal([
                    { type: 'CREATE_ITEM', payload: { id } },
                    { type: 'UPDATE_ITEM_NAME', payload: { id, name } },
                    { type: 'UPDATE_ITEM_LAST_NAME', payload: { id, lastName } },
                    { type: 'UPDATE_ITEM_VALUE', payload: { id, value } },
                    { type: 'PUBLISH_ITEM', payload: { id } }
                ]);
            });

            it('should return eventStream with filtered events', async () => {
                const todoId = uuidV4();
                const userId = uuidV4();
                const todoName = 'Some Todo';
                const userName = 'Alice';
                const todoChecked = true;
                const todoValue = 42;

                storageEvents = [
                    { type: 'TODO_CREATE', payload: { id: todoId } },
                    { type: 'TODO_UPDATE', payload: { id: todoId, name: todoName } },
                    { type: 'USER_CREATE', payload: { id: userId } }
                ];

                busEvents = [
                    { type: 'USER_CREATE', payload: { id: userId } },
                    { type: 'USER_UPDATE', payload: { id: userId, name: userName } },
                    { type: 'TODO_UPDATE', payload: { id: todoId, checked: todoChecked } },
                    { type: 'TODO_UPDATE', payload: { id: todoId, value: todoValue } }
                ];

                const transforms = [
                    new Transform({
                        objectMode: true,
                        transform(event, encoding, callback) {
                            switch (event.type) {
                                case 'TODO_CREATE':
                                case 'TODO_UPDATE':
                                    this.push(event);
                                    break;
                                default:
                            }
                            callback();
                        }
                    })
                ];

                const eventStore = createEventStore({ storage, bus, transforms });

                const eventStream = eventStore.getStreamByEventTypes();

                const todoEvents = await playEvents(eventStream);

                expect(todoEvents).to.deep.equal([
                    { type: 'TODO_CREATE', payload: { id: todoId } },
                    { type: 'TODO_UPDATE', payload: { id: todoId, name: todoName } },
                    { type: 'TODO_UPDATE', payload: { id: todoId, checked: todoChecked } },
                    { type: 'TODO_UPDATE', payload: { id: todoId, value: todoValue } }
                ]);
            });
        });
    });

    describe('getStreamByAggregateId', async () => {
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

        describe('with transforms', () => {
            beforeEach(() => {
                sandbox.restore();
            });

            it('should return eventStream with transformed events', async () => {
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

                const resultEvents = await playEvents(eventStream);

                expect(resultEvents).to.deep.equal([
                    { type: 'FIRST_EVENT', aggregateId, isTransformed: true },
                    { type: 'SECOND_EVENT', aggregateId, isTransformed: true }
                ]);
            });
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
