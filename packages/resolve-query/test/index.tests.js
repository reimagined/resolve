import { expect } from 'chai';
import sinon from 'sinon';

import createQueryExecutor from '../src';
const brokenStateError = new Error('Broken Error');

describe('resolve-query', () => {
    const SIMPLE_READ_MODEL_NAME = 'SIMPLE_READ_MODEL_NAME';
    const GRAPHQL_READ_MODEL_NAME = 'GRAPHQL_READ_MODEL_NAME';

    let eventStore, eventList, normalQuery, brokenSchemaQuery, brokenResolversQuery;

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

        normalQuery = {
            readModels: [
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
                    eventHandlers: {
                        UserAdded: (state, { aggregateId: id, payload: { UserName } }) => {
                            if (state.Users.find(user => user.id === id)) return state;
                            state.Users.push({ id, UserName });
                            return state;
                        },
                        UserDeleted: (state, { aggregateId: id }) => {
                            state.Users = state.Users.filter(user => user.id !== id);
                            return state;
                        }
                    }
                }
            ],
            graphql: {
                gqlSchema: `
                type User {
                    id: ID!
                    UserName: String
                }
                type UsersAndValue {
                    users: [User]
                    value: Int
                }
                type Query {
                    CrossReadModel(aggregateId: ID): UsersAndValue,
                    UserByIdOnDemand(aggregateId: ID!): User,
                    UserById(id: ID!): User,
                    UserIds: [ID!],
                    Users: [User]
                }
            `,
                gqlResolvers: {
                    UserByIdOnDemand: async (getReadModel, args) => {
                        const state = await getReadModel(GRAPHQL_READ_MODEL_NAME, [
                            args.aggregateId
                        ]);
                        return state.Users.find(user => user.id === args.aggregateId);
                    },
                    UserById: async (getReadModel, args) => {
                        const state = await getReadModel(GRAPHQL_READ_MODEL_NAME);
                        return state.Users.find(user => user.id === args.id);
                    },
                    UserIds: async (getReadModel, args) => {
                        const state = await getReadModel(GRAPHQL_READ_MODEL_NAME);
                        return state.Users.map(user => user.id);
                    },
                    CrossReadModel: async (getReadModel, args) => {
                        const idList = args.aggregateId ? [args.aggregateId] : null;
                        const [gqlState, simpleState] = await Promise.all([
                            getReadModel(GRAPHQL_READ_MODEL_NAME, idList),
                            getReadModel(SIMPLE_READ_MODEL_NAME)
                        ]);
                        return {
                            value: simpleState.value,
                            users: gqlState.Users
                        };
                    }
                }
            }
        };

        brokenSchemaQuery = {
            readModels: [
                {
                    initialState: {},
                    name: 'BROKEN_GRAPHQL_SCHEMA_READ_MODEL_NAME',
                    eventHandlers: {}
                }
            ],
            graphql: {
                gqlSchema: 'BROKEN_GRAPHQL_SCHEMA_READ_MODEL_NAME'
            }
        };

        brokenResolversQuery = {
            readModels: [
                {
                    initialState: {},
                    name: 'BROKEN_GRAPHQL_RESOLVER_READ_MODEL_NAME',
                    eventHandlers: {}
                }
            ],
            graphql: {
                gqlSchema: 'type Query { Broken: String }',
                gqlResolvers: {
                    Broken: () => {
                        throw new Error('BROKEN_GRAPHQL_RESOLVER_READ_MODEL_NAME');
                    }
                }
            }
        };
    });

    afterEach(() => {
        normalQuery = null;
        brokenSchemaQuery = null;
        brokenResolversQuery = null;
        eventStore = null;
        eventList = null;
    });

    it.only('should support custom defined resolver without argument', async () => {
        const executeQuery = createQueryExecutor({ eventStore, queryDefinition: normalQuery });
        eventList = eventListForGraphQL.slice(0);

        const state = await executeQuery('query { UserIds }');

        expect(state).to.be.deep.equal({
            UserIds: ['2', '3']
        });
    });

    it('should support custom defined resolver with arguments', async () => {
        const executeQuery = createQueryExecutor({ eventStore, queryDefinition: normalQuery });
        eventList = eventListForGraphQL.slice(0);

        const graphqlQuery = 'query { UserById(id:2) { id, UserName } }';

        const state = await executeQuery(graphqlQuery);

        expect(state).to.be.deep.equal({
            UserById: {
                UserName: 'User-2',
                id: '2'
            }
        });
    });

    // eslint-disable-next-line max-len
    it('should build small on-demand read-models if aggregateId argument specified directly', async () => {
        const graphqlReadModel = normalQuery.readModels.find(
            model => model.name === GRAPHQL_READ_MODEL_NAME
        );

        graphqlReadModel.eventHandlers = {
            UserAdded: sinon.stub().callsFake(graphqlReadModel.eventHandlers.UserAdded),
            UserDeleted: sinon.stub().callsFake(graphqlReadModel.eventHandlers.UserDeleted)
        };

        const executeQuery = createQueryExecutor({ eventStore, queryDefinition: normalQuery });
        eventList = eventListForGraphQL.slice(0);

        const graphqlQuery = 'query { UserByIdOnDemand(aggregateId:2) { id, UserName } }';

        const state = await executeQuery(graphqlQuery);

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
        const executeQuery = createQueryExecutor({ eventStore, queryDefinition: normalQuery });
        eventList = eventListForGraphQL.slice(0);

        const graphqlQuery = 'query ($testId: ID!) { UserById(id: $testId) { id, UserName } }';

        const state = await executeQuery(graphqlQuery, { testId: '3' });

        expect(state).to.be.deep.equal({
            UserById: {
                UserName: 'User-3',
                id: '3'
            }
        });
    });

    // eslint-disable-next-line max-len
    it('should build small on-demand read-models if aggregateId argument specified by variables', async () => {
        const graphqlReadModel = normalQuery.readModels.find(
            model => model.name === GRAPHQL_READ_MODEL_NAME
        );

        graphqlReadModel.eventHandlers = {
            UserAdded: sinon.stub().callsFake(graphqlReadModel.eventHandlers.UserAdded),
            UserDeleted: sinon.stub().callsFake(graphqlReadModel.eventHandlers.UserDeleted)
        };

        const executeQuery = createQueryExecutor({ eventStore, queryDefinition: normalQuery });
        eventList = eventListForGraphQL.slice(0);

        const graphqlQuery =
            'query ($testId: ID!) { UserByIdOnDemand(aggregateId: $testId) { id, UserName } }';

        const state = await executeQuery(graphqlQuery, { testId: '3' });

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
        const executeQuery = createQueryExecutor({ eventStore, queryDefinition: normalQuery });
        eventList = eventListForGraphQL.slice(0);

        const graphqlQuery = 'query { UserById() { id, UserName } }';

        try {
            await executeQuery(graphqlQuery);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error.message).to.have.string('Syntax Error GraphQL request');
            expect(error.message).to.have.string('UserById');
        }
    });

    it('should handle custom GraphQL syntax errors in query', async () => {
        const executeQuery = createQueryExecutor({ eventStore, queryDefinition: normalQuery });
        eventList = eventListForGraphQL.slice(0);

        const graphqlQuery = 'WRONG_QUERY';

        try {
            await executeQuery(graphqlQuery);
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
            createQueryExecutor({ eventStore, queryDefinition: brokenSchemaQuery });
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error.message).to.have.string('Syntax Error GraphQL request');
            expect(error.message).to.have.string('GRAPHQL_READ_MODEL_NAME_BROKEN_SCHEMA');
        }
    });

    it('should raise error in case throwing expection into custom resolver', async () => {
        const executeQuery = createQueryExecutor({
            eventStore,
            queryDefinition: brokenResolversQuery
        });
        eventList = [];

        const graphqlQuery = 'query SomeQuery { Broken }';

        try {
            await executeQuery(graphqlQuery);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error[0].message).to.have.string('GRAPHQL_READ_MODEL_NAME_BROKEN_RESOLVER');
            expect(error[0].path).to.be.deep.equal(['Broken']);
        }
    });

    it('should provide access to regular neighbor read-models in resolver function', async () => {
        const executeQuery = createQueryExecutor({ eventStore, queryDefinition: normalQuery });
        eventList = [
            { type: 'UserAdded', aggregateId: '1', payload: { UserName: 'User-1' } },
            { type: 'UserAdded', aggregateId: '2', payload: { UserName: 'User-2' } },
            { type: 'SuccessEvent', aggregateId: '0' }
        ];

        const graphqlQuery = 'query { CrossReadModel { users { id, UserName }, value } }';

        const state = await executeQuery(graphqlQuery);

        expect(state).to.be.deep.equal({
            CrossReadModel: {
                users: [{ id: '1', UserName: 'User-1' }, { id: '2', UserName: 'User-2' }],
                value: 42
            }
        });
    });

    it('should provide access to on-demand neighbor read-models in resolver function', async () => {
        const executeQuery = createQueryExecutor({ eventStore, queryDefinition: normalQuery });
        eventList = [
            { type: 'UserAdded', aggregateId: '1', payload: { UserName: 'User-1' } },
            { type: 'UserAdded', aggregateId: '2', payload: { UserName: 'User-2' } },
            { type: 'SuccessEvent', aggregateId: '0' }
        ];

        const graphqlQuery =
            'query { CrossReadModel(aggregateId:2) { users { id, UserName }, value } }';

        const state = await executeQuery(graphqlQuery);

        expect(state).to.be.deep.equal({
            CrossReadModel: {
                users: [{ id: '2', UserName: 'User-2' }],
                value: 42
            }
        });
    });

    it('should provide security context to event handlers', async () => {
        const graphqlReadModel = normalQuery.readModels.find(
            model => model.name === GRAPHQL_READ_MODEL_NAME
        );

        graphqlReadModel.gqlResolvers.UserById = sinon
            .stub()
            .callsFake(graphqlReadModel.gqlResolvers.UserById);

        const executeQuery = createQueryExecutor({ eventStore, queryDefinition: normalQuery });
        eventList = eventListForGraphQL.slice(0);

        const getJwt = () => {};
        const graphqlQuery = 'query { UserById(id:2) { id, UserName } }';

        const state = await executeQuery(graphqlQuery, {}, getJwt);

        expect(graphqlReadModel.gqlResolvers.UserById.lastCall.args[2].getJwt).to.be.equal(getJwt);

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
