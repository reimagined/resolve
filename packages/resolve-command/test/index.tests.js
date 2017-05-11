import { expect } from 'chai';
import sinon from 'sinon';

import createStore from '../../resolve-es/src';
import memoryEsDriver from '../../resolve-es-memory/src';

import createBus from '../../resolve-bus/src';
import memoryBusDriver from '../../resolve-bus-memory/src';

import commandHandler from '../src';

describe('command', () => {
    const AGGREGATE_ID = 'test-id';
    const AGGREGATE_NAME = 'test_aggregate';
    const COMMAND_NAME = 'CREATE';
    const EVENT_TYPE = 'CREATED';
    let store;
    let bus;
    let execute;
    let aggregates;
    let testCommand;
    let testEvent;

    beforeEach(() => {
        testCommand = {
            aggregateId: AGGREGATE_ID,
            aggregate: AGGREGATE_NAME,
            commandName: COMMAND_NAME,
            payload: { name: 'Jack' }
        };

        testEvent = {
            aggregateId: AGGREGATE_ID,
            type: EVENT_TYPE,
            payload: { name: 'Jack' }
        };

        aggregates = {
            [AGGREGATE_NAME]: {
                commands: {
                    [COMMAND_NAME]: () => testEvent
                }
            }
        };

        store = createStore({ driver: memoryEsDriver() });
        bus = createBus({ driver: memoryBusDriver() });
        execute = commandHandler({ store, bus, aggregates });
    });

    it('should save and publish event', () => {
        const eventHandlerSpy = sinon.spy();
        bus.onEvent(['TEST_AGGREGATE_CREATED'], eventHandlerSpy);

        return execute(testCommand).then(() => {
            expect(eventHandlerSpy.callCount).to.be.equal(1);
            expect(eventHandlerSpy.lastCall.args[0]).to.be.deep.equal(testEvent);

            const storedEvents = [];
            return store
                .loadEventsByAggregateId(AGGREGATE_ID, event => storedEvents.push(event))
                .then(() => expect(storedEvents).to.be.deep.equal([testEvent]));
        });
    });

    it('should reject event in case of commandName absense', () => {
        delete testCommand.commandName;

        return execute(testCommand)
            .then(() => expect(false).to.be.true)
            .catch(err => expect(err).to.be.equal('commandName argument is required'));
    });

    it('should reject event in case of aggregateId absense', () => {
        delete testCommand.aggregateId;

        return execute(testCommand)
            .then(() => expect(false).to.be.true)
            .catch(err => expect(err).to.be.equal('aggregateId argument is required'));
    });

    it('should pass initialState and args to command handler', () => {
        const createHandlerSpy = sinon.spy(() => testEvent);

        aggregates[AGGREGATE_NAME].commands.CREATE = createHandlerSpy;

        return execute(testCommand).then(() => {
            expect(createHandlerSpy.lastCall.args).to.be.deep.equal([{}, testCommand]);
        });
    });

    it('should get custom initialState and args to command handler', () => {
        const createHandlerSpy = sinon.spy(() => testEvent);

        aggregates[AGGREGATE_NAME].commands.CREATE = createHandlerSpy;
        aggregates[AGGREGATE_NAME].initialState = () => ({
            name: 'Initial name'
        });

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
                type: 'USER_CREATED',
                payload: { name: 'User1' }
            },
            {
                aggregateId: 'test-id-2',
                type: 'USER_CREATED'
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

        aggregates[AGGREGATE_NAME] = {
            eventHandlers: {
                USER_CREATED: userCreatedHandlerSpy,
                USER_UPDATED: userUpdatedHandlerSpy
            },
            commands: {
                CREATE: createHandlerSpy
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
            payload: { name: args.name }
        }));

        const handlerName = `${AGGREGATE_NAME}_${TEST_EVENT_TYPE}`.toUpperCase();
        Object.assign(aggregates[AGGREGATE_NAME], {
            eventHandlers: {
                [handlerName]: (state, event) => ({
                    name: event.name
                })
            },
            commands: {
                [COMMAND_NAME]: createHandlerSpy
            }
        });

        return execute(testCommand).then(() => execute(testCommand)).then(() => {
            expect(createHandlerSpy.lastCall.args).to.be.deep.equal([
                { name: testCommand.name },
                testCommand
            ]);
        });
    });

    it('should handles correctly unnecessary event', () => {
        const events = [
            {
                aggregateId: AGGREGATE_ID,
                type: 'USER_CREATED',
                payload: { name: 'User1' }
            },
            {
                aggregateId: 'test-id-2',
                type: 'USER_CREATED'
            },
            {
                aggregateId: AGGREGATE_ID,
                type: 'USER_UPDATED',
                payload: { newName: 'User2' }
            },
            {
                aggregateId: AGGREGATE_ID,
                type: 'USER_UPDATED',
                payload: { newName: 'User3' }
            }
        ];

        store = createStore({ driver: memoryEsDriver(events) });

        const createHandlerSpy = sinon.spy(() => testEvent);

        aggregates[AGGREGATE_NAME] = {
            eventHandlers: {
                USER_CREATED: (_, event) => ({ name: event.payload.name })
            },
            commands: {
                CREATE: createHandlerSpy
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
});
