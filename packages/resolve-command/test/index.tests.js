import { expect } from 'chai';
import sinon from 'sinon';

import createStore from '../../resolve-es/src';
import memoryEsDriver from '../../resolve-es-memory/src';

import createBus from '../../resolve-bus/src';
import memoryBusDriver from '../../resolve-bus-memory/src';

import commandHandler from '../src';

describe('command', () => {
    let store;
    let bus;
    let execute;
    let aggregates;
    let testCommand;
    let testEvent;

    beforeEach(() => {
        testCommand = {
            __aggregateId: 'test-id',
            __aggregateName: 'USER',
            __commandName: 'CREATE',
            name: 'Vasiliy'
        };

        testEvent = {
            __aggregateId: 'test-id',
            __type: 'USER_CREATED',
            name: 'Vasiliy'
        };

        aggregates = {
            USER: {
                CREATE: () => testEvent
            }
        };

        store = createStore({ driver: memoryEsDriver() });
        bus = createBus({ driver: memoryBusDriver() });
        execute = commandHandler({ store, bus, aggregates });
    });

    it('should save and publish event', () => {
        const eventHandlerSpy = sinon.spy();
        bus.onEvent(['USER_CREATED'], eventHandlerSpy);

        return execute(testCommand).then(() => {
            expect(eventHandlerSpy.callCount).to.be.equal(1);
            expect(eventHandlerSpy.lastCall.args[0])
                .to.be.deep.equal(testEvent);

            const storedEvents = [];
            return store.loadEventsByAggregateId('test-id', event => storedEvents.push(event))
                .then(() => expect(storedEvents)
                    .to.be.deep.equal([testEvent])
                );
        });
    });

    it('should reject event in case of aggregateName absense', () => {
        delete testCommand.__aggregateName;

        return execute(testCommand)
            .then(() => expect(false).to.be.true)
            .catch(err => expect(err).to.be.equal('__aggregateName argument is required'));
    });

    it('should reject event in case of commandName absense', () => {
        delete testCommand.__commandName;

        return execute(testCommand)
            .then(() => expect(false).to.be.true)
            .catch(err => expect(err).to.be.equal('__commandName argument is required'));
    });

    it('should reject event in case of aggregateId absense', () => {
        delete testCommand.__aggregateId;

        return execute(testCommand)
            .then(() => expect(false).to.be.true)
            .catch(err => expect(err).to.be.equal('__aggregateId argument is required'));
    });

    it('should pass initialState and args to command handler', () => {
        const createHandlerSpy = sinon.spy(() => testEvent);

        aggregates.USER.CREATE = createHandlerSpy;

        return execute(testCommand).then(() => {
            expect(createHandlerSpy.lastCall.args).to.be.deep.equal([
                {},
                testCommand
            ]);
        });
    });

    it('should get custom initialState and args to command handler', () => {
        const createHandlerSpy = sinon.spy(() => testEvent);

        aggregates.USER.CREATE = createHandlerSpy;
        aggregates.USER.__initialState = () => ({
            users: []
        });

        return execute(testCommand).then(() => {
            expect(createHandlerSpy.lastCall.args).to.be.deep.equal([
                { users: [] },
                testCommand
            ]);
        });
    });

    it('should pass initialState and args to command handler', () => {
        store = createStore({ driver: memoryEsDriver([
            { __aggregateId: 'test-id', __type: 'USER_CREATED', name: 'User1' },
            { __aggregateId: 'test-id-2', __type: 'USER_CREATED' },
            { __aggregateId: 'test-id', __type: 'USER_UPDATED', name: 'User1', newName: 'User2' }
        ]) });

        const applyEventHandlerSpy = sinon.spy((state, event) => {
            if (event.__type === 'USER_CREATED') {
                state.users.push(event.name);
            }
            if (event.__type === 'USER_UPDATED') {
                const userIndex = state.users.indexOf(event.name);
                if (userIndex >= 0) state.users[userIndex] = event.newName;
            }

            return state;
        });

        const createHandlerSpy = sinon.spy(() => testEvent);

        Object.assign(aggregates.USER, {
            __applyEvent: applyEventHandlerSpy,
            __initialState: () => ({ users: [] }),
            CREATE: createHandlerSpy
        });

        execute = commandHandler({ store, bus, aggregates });

        return execute(testCommand).then(() => {
            expect(createHandlerSpy.lastCall.args).to.be.deep.equal([
                { users: ['User2'] },
                testCommand
            ]);

            expect(applyEventHandlerSpy.callCount).to.be.equal(2);
        });
    });
});
