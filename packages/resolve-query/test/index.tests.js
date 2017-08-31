import { expect } from 'chai';
import sinon from 'sinon';

import createQueryExecutor from '../src';
const brokenStateError = new Error('Broken Error');

describe('resolve-query', () => {
    const SIMPLE_READ_MODEL_NAME = 'readModelName';
    const GRAPHQL_READ_MODEL_NAME = 'graphqlReadModelName';

    let eventStore, eventList;

    const readModels = [
        {
            initialState: {},
            name: SIMPLE_READ_MODEL_NAME,
            eventHandlers: {
                SuccessEvent: (state, event) => {
                    return { ...state, value: 42 };
                },
                BrokenEvent: (state, event) => {
                    throw brokenStateError;
                }
            }
        },
        {
            initialState: { Users: [] },
            name: GRAPHQL_READ_MODEL_NAME,
            gqlSchema: `
                type User {
                    id: ID!
                    UserName: String
                }
                type Query {
                    UserByIdOnDemand(aggregateId: ID!): User,
                    UserById(id: ID!): User,
                    UserIds: [ID!],
                    Users: [User],
                }
            `,
            // Following arguments redefined in beforeEach section
            eventHandlers: null,
            gqlResolvers: null
        }
    ];

    const brokenSchemaReadModels = [
        {
            initialState: {},
            name: 'GRAPHQL_READ_MODEL_NAME_BROKEN_SCHEMA',
            eventHandlers: {},
            gqlSchema: 'GRAPHQL_READ_MODEL_NAME_BROKEN_SCHEMA'
        }
    ];

    const brokenResolversReadModels = [
        {
            initialState: {},
            name: 'GRAPHQL_READ_MODEL_NAME_BROKEN_RESOLVER',
            eventHandlers: {},
            gqlSchema: 'type Query { Broken: String }',
            gqlResolvers: {
                Broken: () => {
                    throw new Error('GRAPHQL_READ_MODEL_NAME_BROKEN_RESOLVER');
                }
            }
        }
    ];

    const eventListForGraphQL = [
        { type: 'UserAdded', aggregateId: '1', payload: { UserName: 'User-1' } },
        { type: 'UserAdded', aggregateId: '2', payload: { UserName: 'User-2' } },
        { type: 'UserAdded', aggregateId: '3', payload: { UserName: 'User-3' } },
        { type: 'UserDeleted', aggregateId: '1' }
    ];

    beforeEach(() => {
        eventList = [];

        eventStore = {
            subscribeByEventType: sinon
                .stub()
                .callsFake((matchList, handler) =>
                    eventList
                        .filter(event => matchList.includes(event.type))
                        .forEach(event => handler(event))
                ),
            subscribeByAggregateId: sinon
                .stub()
                .callsFake((matchList, handler) =>
                    eventList
                        .filter(event => matchList.includes(event.aggregateId))
                        .forEach(event => handler(event))
                )
        };

        const graphqlReadModel = readModels.find(model => model.name === GRAPHQL_READ_MODEL_NAME);
        graphqlReadModel.eventHandlers = {
            UserAdded: (state, { aggregateId: id, payload: { UserName } }) => {
                if (state.Users.find(user => user.id === id)) return state;
                state.Users.push({ id, UserName });
                return state;
            },
            UserDeleted: (state, { aggregateId: id }) => {
                state.Users = state.Users.filter(user => user.id !== id);
                return state;
            }
        };

        graphqlReadModel.gqlResolvers = {
            UserByIdOnDemand: (root, args) => root.Users.find(user => user.id === args.aggregateId),
            UserById: (root, args) => root.Users.find(user => user.id === args.id),
            UserIds: (root, args) => root.Users.map(user => user.id)
        };
    });

    afterEach(() => {
        eventStore = null;
        eventList = null;
    });

    it('should build state on valid event and return it on query', async () => {
        const executeQuery = createQueryExecutor({ eventStore, readModels });
        eventList = [{ type: 'SuccessEvent' }];

        const state = await executeQuery(SIMPLE_READ_MODEL_NAME);

        expect(state).to.be.deep.equal({
            value: 42
        });
    });

    it('should handle broken event', async () => {
        const executeQuery = createQueryExecutor({ eventStore, readModels });
        eventList = [{ type: 'BrokenEvent' }];

        try {
            await executeQuery(SIMPLE_READ_MODEL_NAME);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error).to.be.equal(brokenStateError);
        }
    });

    it('should handle errors on read side', async () => {
        const readSideError = new Error('Broken Error');
        const executeQuery = createQueryExecutor({ eventStore, readModels });
        eventList = [{ type: 'BrokenEvent' }];

        try {
            await executeQuery(SIMPLE_READ_MODEL_NAME);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error).to.be.deep.equal(readSideError);
        }
    });

    it('should handle errors on read side taking by bus', async () => {
        let eventHandler;
        const readSideError = new Error('Broken Error');

        eventStore = {
            subscribeByEventType: sinon.stub().callsFake((eventTypes, handler) => {
                eventHandler = handler;
                return handler(eventList.shift());
            })
        };
        eventList = [{ type: 'SuccessEvent' }, { type: 'SuccessEvent' }];
        const executeQuery = createQueryExecutor({ eventStore, readModels });
        await executeQuery(SIMPLE_READ_MODEL_NAME);

        eventHandler({ type: 'BrokenEvent' });

        try {
            await executeQuery(SIMPLE_READ_MODEL_NAME);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error).to.be.deep.equal(readSideError);
        }
    });

    it('should handle non-existing query executor', async () => {
        const executeQuery = createQueryExecutor({ eventStore, readModels });
        eventList = [{ type: 'BrokenEvent' }];

        try {
            await executeQuery('WRONG_SIMPLE_READ_MODEL_NAME');
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error.message).to.be.equal(
                'The \'WRONG_SIMPLE_READ_MODEL_NAME\' read model is not found'
            );
        }
    });

    it('should handle graphql query on read model which does not support it', async () => {
        const executeQuery = createQueryExecutor({ eventStore, readModels });
        eventList = [{ type: 'SuccessEvent' }];
        const graphqlQuery = 'query { UserIds }';

        try {
            await executeQuery(SIMPLE_READ_MODEL_NAME, graphqlQuery);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error.message).to.be.equal(
                `GraphQL schema for '${SIMPLE_READ_MODEL_NAME}' read model is not found`
            );
        }
    });

    it('should bypass graphql handlers if request does not include graphql query', async () => {
        const executeQuery = createQueryExecutor({ eventStore, readModels });
        eventList = eventListForGraphQL.slice(0);

        const state = await executeQuery(GRAPHQL_READ_MODEL_NAME);

        expect(state).to.be.deep.equal({
            Users: [{ UserName: 'User-2', id: '2' }, { UserName: 'User-3', id: '3' }]
        });
    });

    it('should support default resolvers for graphql based on defined schema', async () => {
        const executeQuery = createQueryExecutor({ eventStore, readModels });
        eventList = eventListForGraphQL.slice(0);

        const graphqlQuery = 'query { Users { id, UserName } }';

        const state = await executeQuery(GRAPHQL_READ_MODEL_NAME, graphqlQuery);

        expect(state).to.be.deep.equal({
            Users: [{ UserName: 'User-2', id: '2' }, { UserName: 'User-3', id: '3' }]
        });
    });

    it('should support custom defined resolver without argument', async () => {
        const executeQuery = createQueryExecutor({ eventStore, readModels });
        eventList = eventListForGraphQL.slice(0);

        const graphqlQuery = 'query { UserIds }';

        const state = await executeQuery(GRAPHQL_READ_MODEL_NAME, graphqlQuery);

        expect(state).to.be.deep.equal({
            UserIds: ['2', '3']
        });
    });

    it('should support custom defined resolver with arguments', async () => {
        const executeQuery = createQueryExecutor({ eventStore, readModels });
        eventList = eventListForGraphQL.slice(0);

        const graphqlQuery = 'query { UserById(id:2) { id, UserName } }';

        const state = await executeQuery(GRAPHQL_READ_MODEL_NAME, graphqlQuery);

        expect(state).to.be.deep.equal({
            UserById: {
                UserName: 'User-2',
                id: '2'
            }
        });
    });

    // eslint-disable-next-line max-len
    it('should build small on-demand read-models if aggregateId argument specified directly', async () => {
        const graphqlReadModel = readModels.find(model => model.name === GRAPHQL_READ_MODEL_NAME);

        graphqlReadModel.eventHandlers = {
            UserAdded: sinon.stub().callsFake(graphqlReadModel.eventHandlers.UserAdded),
            UserDeleted: sinon.stub().callsFake(graphqlReadModel.eventHandlers.UserDeleted)
        };

        const executeQuery = createQueryExecutor({ eventStore, readModels });
        eventList = eventListForGraphQL.slice(0);

        const graphqlQuery = 'query { UserByIdOnDemand(aggregateId:2) { id, UserName } }';

        const state = await executeQuery(GRAPHQL_READ_MODEL_NAME, graphqlQuery);

        expect(graphqlReadModel.eventHandlers.UserAdded.callCount).to.be.equal(1);
        expect(graphqlReadModel.eventHandlers.UserDeleted.callCount).to.be.equal(0);

        expect(state).to.be.deep.equal({
            UserByIdOnDemand: {
                UserName: 'User-2',
                id: '2'
            }
        });
    });

    it('should support custom defined resolver with arguments valued by variables', async () => {
        const executeQuery = createQueryExecutor({ eventStore, readModels });
        eventList = eventListForGraphQL.slice(0);

        const graphqlQuery = 'query ($testId: ID!) { UserById(id: $testId) { id, UserName } }';

        const state = await executeQuery(GRAPHQL_READ_MODEL_NAME, graphqlQuery, { testId: '3' });

        expect(state).to.be.deep.equal({
            UserById: {
                UserName: 'User-3',
                id: '3'
            }
        });
    });

    // eslint-disable-next-line max-len
    it('should build small on-demand read-models if aggregateId argument specified by variables', async () => {
        const graphqlReadModel = readModels.find(model => model.name === GRAPHQL_READ_MODEL_NAME);

        graphqlReadModel.eventHandlers = {
            UserAdded: sinon.stub().callsFake(graphqlReadModel.eventHandlers.UserAdded),
            UserDeleted: sinon.stub().callsFake(graphqlReadModel.eventHandlers.UserDeleted)
        };

        const executeQuery = createQueryExecutor({ eventStore, readModels });
        eventList = eventListForGraphQL.slice(0);

        const graphqlQuery =
            'query ($testId: ID!) { UserByIdOnDemand(aggregateId: $testId) { id, UserName } }';

        const state = await executeQuery(GRAPHQL_READ_MODEL_NAME, graphqlQuery, { testId: '3' });

        expect(graphqlReadModel.eventHandlers.UserAdded.callCount).to.be.equal(1);
        expect(graphqlReadModel.eventHandlers.UserDeleted.callCount).to.be.equal(0);

        expect(state).to.be.deep.equal({
            UserByIdOnDemand: {
                UserName: 'User-3',
                id: '3'
            }
        });
    });

    it('should handle error in case of wrong arguments for custom defined resolver', async () => {
        const executeQuery = createQueryExecutor({ eventStore, readModels });
        eventList = eventListForGraphQL.slice(0);

        const graphqlQuery = 'query { UserById() { id, UserName } }';

        try {
            await executeQuery(GRAPHQL_READ_MODEL_NAME, graphqlQuery);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error.message).to.have.string('Syntax Error GraphQL request');
            expect(error.message).to.have.string('UserById');
        }
    });

    it('should handle custom GraphQL syntax errors in query', async () => {
        const executeQuery = createQueryExecutor({ eventStore, readModels });
        eventList = eventListForGraphQL.slice(0);

        const graphqlQuery = 'WRONG_QUERY';

        try {
            await executeQuery(GRAPHQL_READ_MODEL_NAME, graphqlQuery);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error.message).to.have.string('Syntax Error GraphQL request');
            expect(error.message).to.have.string('Unexpected Name');
            expect(error.message).to.have.string('WRONG_QUERY');
        }
    });

    it('should raise error in case of invalid GraphQL schema for read-model', async () => {
        eventList = [];

        try {
            createQueryExecutor({ eventStore, readModels: brokenSchemaReadModels });
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error.message).to.have.string('Syntax Error GraphQL request');
            expect(error.message).to.have.string('GRAPHQL_READ_MODEL_NAME_BROKEN_SCHEMA');
        }
    });

    it('should raise error in case throwing expection into custom resolver', async () => {
        const executeQuery = createQueryExecutor({
            eventStore,
            readModels: brokenResolversReadModels
        });
        eventList = [];

        const graphqlQuery = 'query SomeQuery { Broken }';

        try {
            await executeQuery('GRAPHQL_READ_MODEL_NAME_BROKEN_RESOLVER', graphqlQuery);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error[0].message).to.have.string('GRAPHQL_READ_MODEL_NAME_BROKEN_RESOLVER');
            expect(error[0].path).to.be.deep.equal(['Broken']);
        }
    });

    it('should provide security context to event handlers', async () => {
        const graphqlReadModel = readModels.find(model => model.name === GRAPHQL_READ_MODEL_NAME);

        graphqlReadModel.gqlResolvers.UserById = sinon
            .stub()
            .callsFake(graphqlReadModel.gqlResolvers.UserById);

        const executeQuery = createQueryExecutor({ eventStore, readModels });
        eventList = eventListForGraphQL.slice(0);

        const securityContext = { testField: 'testValue' };
        const graphqlQuery = 'query { UserById(id:2) { id, UserName } }';

        const state = await executeQuery(
            GRAPHQL_READ_MODEL_NAME,
            graphqlQuery,
            {},
            securityContext
        );

        expect(graphqlReadModel.gqlResolvers.UserById.lastCall.args[2]).to.be.deep.equal({
            securityContext
        });

        expect(state).to.be.deep.equal({
            UserById: {
                UserName: 'User-2',
                id: '2'
            }
        });
    });

    it('works the same way for different import types', () => {
        expect(createQueryExecutor).to.be.equal(require('../src'));
    });
});
