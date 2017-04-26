import { expect } from 'chai';
import sinon from 'sinon';

import createStore from '../../resolve-es/src';
import memoryEsDriver from '../../resolve-es-memory/src';

import createBus from '../../resolve-bus/src';
import memoryBusDriver from '../../resolve-bus-memory/src';

import commandHandler from '../src';

describe('command', () => {
    const aggregates = {
        USER: {
            // __applyEvents: (initialState, events) => {state}},
            // __initialState: () => initialState,
            CREATE: () => null
        }
    };
    let store;
    let bus;
    let execute;

    beforeEach(() => {
        store = createStore({ driver: memoryEsDriver() });
        bus = createBus({ driver: memoryBusDriver() });
        execute = commandHandler({ store, bus, aggregates });
    });

    it('should save and publish event', () => {
        const eventHandlerSpy = sinon.spy();
        bus.onEvent(['USER_CREATED'], eventHandlerSpy);

        const command = {
            __aggregateId: 'test-id',
            __aggregateName: 'USER',
            __commandName: 'CREATE',
            name: 'Vasiliy'
        };
        const userCreatedEvent = Object.assign({ __type: 'USER_CREATED' }, command);

        aggregates.USER.CREATE = () => userCreatedEvent;

        return execute(command).then(() => {
            expect(eventHandlerSpy.callCount).to.be.equal(1);
            expect(eventHandlerSpy.lastCall.args[0])
                .to.be.deep.equal(userCreatedEvent);

            const storedEvents = [];
            return store.loadEventsByAggregateId('test-id', event => storedEvents.push(event))
                .then(() => expect(storedEvents)
                    .to.be.deep.equal([userCreatedEvent])
                );
        });
    });

    it('should reject event in case of aggregateName absense', () => {
        const command = {
            __aggregateId: 'test-id',
            __commandName: 'CREATE',
            name: 'Vasiliy'
        };

        return execute(command)
            .then(() => expect(false).to.be.true)
            .catch(err => expect(err).to.be.equal('Miss __aggregateName argument'));
    });

    it('should reject event in case of commandName absense', () => {
        const command = {
            __aggregateId: 'test-id',
            __aggregateName: 'USER',
            name: 'Vasiliy'
        };

        return execute(command)
            .then(() => expect(false).to.be.true)
            .catch(err => expect(err).to.be.equal('Miss __commandName argument'));
    });

    it('should reject event in case of aggregateId absense', () => {
        const command = {
            __aggregateName: 'USER',
            __commandName: 'CREATE',
            name: 'Vasiliy'
        };

        return execute(command)
            .then(() => expect(false).to.be.true)
            .catch(err => expect(err).to.be.equal('Miss __aggregateId argument'));
    });

    it('should pass initialState and args to command handler', () => {
        const command = {
            __aggregateId: 'test-id',
            __aggregateName: 'USER',
            __commandName: 'CREATE',
            name: 'Vasiliy'
        };
        const createHandlerSpy = sinon.spy(() =>
            Object.assign({ __type: command.__commandName }, command)
        );

        aggregates.USER.CREATE = createHandlerSpy;

        return execute(command).then(() => {
            expect(createHandlerSpy.lastCall.args).to.be.deep.equal([
                {},
                command
            ]);
        });
    });

    it('should pass initialState and args to command handler', () => {
        store = createStore({ driver: memoryEsDriver([
            { __aggregateId: 'test-id', __type: 'USER_CREATED', name: 'User1' },
            { __aggregateId: 'test-id-2', __type: 'USER_CREATED' },
            { __aggregateId: 'test-id', __type: 'USER_UPDATED', name: 'User2' }
        ]) });

        const applyEventsHandlerSpy = sinon.spy((state, event) => {
            if (event.__type === 'USER_CREATED') {
                state.users
            }
        });
        aggregates.USER.__applyEvents =

        execute = commandHandler({ store, bus, aggregates });

        const command = {
            __aggregateId: 'test-id',
            __aggregateName: 'USER',
            __commandName: 'CREATE',
            name: 'Vasiliy'
        };
        const createHandlerSpy = sinon.spy(() =>
            Object.assign({ __type: command.__commandName }, command)
        );

        aggregates.USER.CREATE = createHandlerSpy;

        return execute(command).then(() => {
            expect(createHandlerSpy.lastCall.args).to.be.deep.equal([
                {},
                command
            ]);
        });
    });
});

// const aggregates = {
//     'aggregate-name-1': {
//         __applyEvents: (events, initialState?) => state,
//         command1: (state, args) => event
//     }
// }

// const execute = command({ es, bus, aggregates });

// execute({
//     __aggregateId: '',
//     __aggregateName: '',
//     __commandName: 'USER_CREATE',
//     name: 'Vasiliy'
// });

// aggregate = loadAggregate(request.aggregateId)
// try {
//    event = await aggregate.executeComman(command)
//    await eventStore.saveEvent(event)
//    await response.write(success)
// } catch(err) {
//    await response.write(fail)
// }
// await eventBus.publish(event)

// commandHandler responsobility
//  - publish event (has to know about event bus)
//  - save event (has to know about es)
//  - execute command from aggregate (has to know about aggregates)
