import { expect } from 'chai';
import sinon from 'sinon';

import createStore from '../../resolve-es/src';
import memoryEsDriver from '../../resolve-es-memory/src';

import createBus from '../../resolve-bus/src';
import memoryBusDriver from '../../resolve-bus-memory/src';

import commandHandler from '../src';

describe('command', () => {
    const AGGREGATE_ID = 'test-id';
    const AGGREGATE_NAME = 'testAggregate';
    const COMMAND_TYPE = 'create';
    const EVENT_TYPE = 'created';

    let store;
    let bus;
    let execute;
    let aggregates;
    let testCommand;
    let testEvent;

    beforeEach(() => {
        sinon.stub(Date, 'now').returns(123);

        testCommand = {
            aggregateId: AGGREGATE_ID,
            aggregateName: AGGREGATE_NAME,
            type: COMMAND_TYPE,
            payload: { name: 'Jack' }
        };

        testEvent = {
            aggregateId: AGGREGATE_ID,
            type: EVENT_TYPE,
            timestamp: 123,
            payload: { name: 'Jack' }
        };

        aggregates = [
            {
                name: AGGREGATE_NAME,
                commands: {
                    [COMMAND_TYPE]: () => ({
                        type: EVENT_TYPE,
                        payload: { name: 'Jack' }
                    })
                }
            }
        ];

        store = createStore({ driver: memoryEsDriver() });
        bus = createBus({ driver: memoryBusDriver() });
        execute = commandHandler({ store, bus, aggregates });
    });

    afterEach(() => {
        Date.now.restore();
    });

    it('should save and publish event', () => {
        const eventHandlerSpy = sinon.spy();
        bus.onEvent([EVENT_TYPE], eventHandlerSpy);

        return execute(testCommand).then(() => {
            expect(eventHandlerSpy.callCount).to.be.equal(1);
            expect(eventHandlerSpy.lastCall.args).to.be.deep.equal([testEvent]);

            const storedEvents = [];
            return store
                .loadEventsByAggregateId(AGGREGATE_ID, event => storedEvents.push(event))
                .then(() => expect(storedEvents).to.be.deep.equal([testEvent]));
        });
    });

    it('should reject event in case of command.type absence', () => {
        delete testCommand.type;

        return execute(testCommand)
            .then(() => expect(false).to.be.true)
            .catch(err => expect(err).to.be.equal('"type" argument is required'));
    });

    it('should reject event in case of command.aggregateId absence', () => {
        delete testCommand.aggregateId;

        return execute(testCommand)
            .then(() => expect(false).to.be.true)
            .catch(err => expect(err).to.be.equal('"aggregateId" argument is required'));
    });

    it('should reject event in case of aggregate absence', () => {
        delete testCommand.aggregateName;

        return execute(testCommand)
            .then(() => expect(false).to.be.true)
            .catch(err => expect(err).to.be.equal('"aggregateName" argument is required'));
    });

    it('should pass initialState and args to command handler', () => {
        const createHandlerSpy = sinon.stub().returns({
            type: EVENT_TYPE,
            payload: {}
        });

        aggregates[0].commands[COMMAND_TYPE] = createHandlerSpy;

        return execute(testCommand).then(() => {
            expect(createHandlerSpy.lastCall.args).to.be.deep.equal([{}, testCommand]);
        });
    });

    it('should get custom initialState and args to command handler', () => {
        const createHandlerSpy = sinon.stub().returns({
            type: EVENT_TYPE,
            payload: {}
        });

        aggregates[0].commands[COMMAND_TYPE] = createHandlerSpy;

        aggregates[0].initialState = {
            name: 'Initial name'
        };

        return execute(testCommand).then(() => {
            expect(createHandlerSpy.lastCall.args).to.be.deep.equal([
                { name: 'Initial name' },
                testCommand
            ]);
        });
    });

    it('should pass initialState and args to command handler', () => {
        const events = [
            {
                aggregateId: AGGREGATE_ID,
                type: EVENT_TYPE,
                payload: { name: 'User1' }
            },
            {
                aggregateId: 'test-id-2',
                type: EVENT_TYPE
            },
            {
                aggregateId: AGGREGATE_ID,
                type: 'USER_UPDATED',
                payload: {
                    name: 'User1',
                    newName: 'User2'
                }
            }
        ];

        store = createStore({ driver: memoryEsDriver(events) });

        const createHandlerSpy = sinon.spy(() => testEvent);

        const userCreatedHandlerSpy = sinon.spy((state, event) => ({
            name: event.payload.name
        }));

        const userUpdatedHandlerSpy = sinon.spy((state, event) => ({
            name: event.payload.newName
        }));

        aggregates[0] = {
            name: AGGREGATE_NAME,
            eventHandlers: {
                [EVENT_TYPE]: userCreatedHandlerSpy,
                USER_UPDATED: userUpdatedHandlerSpy
            },
            commands: {
                [COMMAND_TYPE]: createHandlerSpy
            }
        };

        execute = commandHandler({ store, bus, aggregates });

        return execute(testCommand).then(() => {
            expect(createHandlerSpy.lastCall.args).to.be.deep.equal([
                { name: 'User2' },
                testCommand
            ]);

            expect(userCreatedHandlerSpy.callCount).to.be.equal(1);
            expect(userCreatedHandlerSpy.lastCall.args).to.be.deep.equal([{}, events[0]]);

            expect(userUpdatedHandlerSpy.callCount).to.be.equal(1);
            expect(userUpdatedHandlerSpy.lastCall.args).to.be.deep.equal([
                { name: 'User1' },
                events[2]
            ]);
        });
    });

    it('should return event without additional fields', () => {
        const TEST_EVENT_TYPE = 'TEST_HANDLED';
        const createHandlerSpy = sinon.spy((state, args) => ({
            type: TEST_EVENT_TYPE,
            payload: { name: args.payload.name }
        }));

        Object.assign(aggregates[0], {
            eventHandlers: {
                [TEST_EVENT_TYPE]: (state, event) => ({
                    name: event.payload.name
                })
            },
            commands: {
                [COMMAND_TYPE]: createHandlerSpy
            }
        });

        return execute(testCommand).then(() => execute(testCommand)).then(() => {
            expect(createHandlerSpy.lastCall.args).to.be.deep.equal([
                { name: testCommand.payload.name },
                testCommand
            ]);
        });
    });

    it('should handles correctly unnecessary event', () => {
        const events = [
            {
                aggregateId: AGGREGATE_ID,
                type: EVENT_TYPE,
                payload: { name: 'User1' }
            },
            {
                aggregateId: 'test-id-2',
                type: 'updated'
            },
            {
                aggregateId: AGGREGATE_ID,
                type: 'updated',
                payload: { newName: 'User2' }
            },
            {
                aggregateId: AGGREGATE_ID,
                type: 'updated',
                payload: { newName: 'User3' }
            }
        ];

        store = createStore({ driver: memoryEsDriver(events) });

        const createHandlerSpy = sinon.spy(() => testEvent);

        aggregates[0] = {
            name: AGGREGATE_NAME,
            eventHandlers: {
                [EVENT_TYPE]: (_, event) => ({ name: event.payload.name })
            },
            commands: {
                [COMMAND_TYPE]: createHandlerSpy
            }
        };

        execute = commandHandler({ store, bus, aggregates });

        return execute(testCommand).then(() => {
            expect(createHandlerSpy.lastCall.args).to.be.deep.equal([
                { name: 'User1' },
                testCommand
            ]);
        });
    });

    it('should reject event in case of event.type absence', () => {
        aggregates[0].commands[COMMAND_TYPE] = (state, args) => ({
            payload: { name: args.payload.name }
        });

        return execute(testCommand)
            .then(() => expect(false).to.be.true)
            .catch(err => expect(err).to.be.equal('event type is required'));
    });

    it('works the same way for different import types', () => {
        expect(commandHandler).to.be.equal(require('../src'));
    });
});
