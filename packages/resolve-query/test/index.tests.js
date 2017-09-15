import { expect } from 'chai';
import sinon from 'sinon';

import createQueryExecutor from '../src';
const brokenStateError = new Error('Broken Error');

describe('resolve-query', () => {
    let eventStore, eventList, normalReadModel, brokenSchemaReadModel, brokenResolversReadModel;

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
                    Promise.resolve(
                        eventList
                            .filter(event => matchList.includes(event.type))
                            .forEach(event => handler(event))
                    )
                ),
            subscribeByAggregateId: sinon
                .stub()
                .callsFake((matchList, handler) =>
                    Promise.resolve(
                        eventList
                            .filter(event => matchList.includes(event.aggregateId))
                            .forEach(event => handler(event))
                    )
                )
        };

        normalReadModel = {
            name: 'NORMAL_READ_MODEL_NAME',
            eventHandlers: {
                UserAdded: (state, { aggregateId: id, payload: { UserName } }) => {
                    const newState = state || [];
                    newState.Users = newState.Users || [];
                    if (newState.Users.find(user => user.id === id)) return newState;
                    newState.Users.push({ id, UserName });
                    return newState;
                },
                UserDeleted: (state, { aggregateId: id }) => {
                    const newState = state || [];
                    newState.Users = newState.Users || [];
                    newState.Users = newState.Users.filter(user => user.id !== id);
                    return newState;
                },
                BrokenEvent: (state, event) => {
                    throw brokenStateError;
                }
            },

            gqlSchema: `
                type User {
                    id: ID!
                    UserName: String
                }
                type Query {
                    UserByIdOnDemand(aggregateId: ID!): User,
                    UserById(id: ID!): User,
                    UserIds: [ID!],
                    Users: [User]
                }
            `,
            gqlResolvers: {
                UserByIdOnDemand: async (read, args) => {
                    if (!args.aggregateId) throw new Error('aggregateId is mandatory');
                    const { Users } = await read({ aggregateIds: [args.aggregateId] });
                    return Users.find(user => user.id === args.aggregateId);
                },
                UserById: async (read, args) => {
                    const { Users } = await read();
                    return Users.find(user => user.id === args.id);
                },
                UserIds: async (read, args) => {
                    const { Users } = await read();
                    return Users.map(user => user.id);
                },
                Users: async (read, args) => {
                    const { Users } = await read();
                    return Users;
                }
            }
        };

        brokenSchemaReadModel = {
            name: 'BROKEN_GRAPHQL_SCHEMA_READ_MODEL_NAME',
            eventHandlers: {},
            gqlSchema: 'BROKEN_GRAPHQL_SCHEMA_READ_MODEL_NAME'
        };

        brokenSchemaReadModel = {
            name: 'BROKEN_GRAPHQL_RESOLVER_READ_MODEL_NAME',
            eventHandlers: {},

            gqlSchema: 'type Query { Broken: String }',
            gqlResolvers: {
                Broken: () => {
                    throw new Error('BROKEN_GRAPHQL_RESOLVER_READ_MODEL_NAME');
                }
            }
        };
    });

    afterEach(() => {
        brokenResolversReadModel = null;
        brokenSchemaReadModel = null;
        normalReadModel = null;
        eventStore = null;
        eventList = null;
    });

    it('should support custom defined resolver without argument', async () => {
        const executeQuery = createQueryExecutor({ eventStore, readModel: normalReadModel });
        eventList = eventListForGraphQL.slice(0);

        const state = await executeQuery('query { UserIds }');

        expect(state).to.be.deep.equal({
            UserIds: ['2', '3']
        });
    });

    it('should support custom defined resolver with arguments', async () => {
        const executeQuery = createQueryExecutor({ eventStore, readModel: normalReadModel });
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
        normalReadModel.eventHandlers = {
            UserAdded: sinon.stub().callsFake(normalReadModel.eventHandlers.UserAdded),
            UserDeleted: sinon.stub().callsFake(normalReadModel.eventHandlers.UserDeleted)
        };

        const executeQuery = createQueryExecutor({ eventStore, readModel: normalReadModel });
        eventList = eventListForGraphQL.slice(0);

        const graphqlQuery = 'query { UserByIdOnDemand(aggregateId:2) { id, UserName } }';

        const state = await executeQuery(graphqlQuery);

        expect(normalReadModel.eventHandlers.UserAdded.callCount).to.be.equal(1);
        expect(normalReadModel.eventHandlers.UserDeleted.callCount).to.be.equal(0);

        expect(state).to.be.deep.equal({
            UserByIdOnDemand: {
                UserName: 'User-2',
                id: '2'
            }
        });
    });

    it('should support custom defined resolver with arguments valued by variables', async () => {
        const executeQuery = createQueryExecutor({ eventStore, readModel: normalReadModel });
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
        normalReadModel.eventHandlers = {
            UserAdded: sinon.stub().callsFake(normalReadModel.eventHandlers.UserAdded),
            UserDeleted: sinon.stub().callsFake(normalReadModel.eventHandlers.UserDeleted)
        };

        const executeQuery = createQueryExecutor({ eventStore, readModel: normalReadModel });
        eventList = eventListForGraphQL.slice(0);

        const graphqlQuery =
            'query ($testId: ID!) { UserByIdOnDemand(aggregateId: $testId) { id, UserName } }';

        const state = await executeQuery(graphqlQuery, { testId: '3' });

        expect(normalReadModel.eventHandlers.UserAdded.callCount).to.be.equal(1);
        expect(normalReadModel.eventHandlers.UserDeleted.callCount).to.be.equal(0);

        expect(state).to.be.deep.equal({
            UserByIdOnDemand: {
                UserName: 'User-3',
                id: '3'
            }
        });
    });

    it('should handle error in case of wrong arguments for custom defined resolver', async () => {
        const executeQuery = createQueryExecutor({ eventStore, readModel: normalReadModel });
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
        const executeQuery = createQueryExecutor({ eventStore, readModel: normalReadModel });
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
            createQueryExecutor({ eventStore, readModel: brokenSchemaReadModel });
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error.message).to.have.string('Syntax Error GraphQL request');
            expect(error.message).to.have.string('BROKEN_GRAPHQL_SCHEMA_READ_MODEL_NAME');
        }
    });

    it('should raise error in case throwing expection into custom resolver', async () => {
        const executeQuery = createQueryExecutor({
            eventStore,
            readModel: brokenResolversReadModel
        });
        eventList = [];

        const graphqlQuery = 'query SomeQuery { Broken }';

        try {
            await executeQuery(graphqlQuery);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error[0].message).to.have.string('BROKEN_GRAPHQL_RESOLVER_READ_MODEL_NAME');
            expect(error[0].path).to.be.deep.equal(['Broken']);
        }
    });

    it('should provide access to regular neighbor read-models in resolver function', async () => {
        const executeQuery = createQueryExecutor({ eventStore, readModel: normalReadModel });
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

    it('should provide security context to event handlers', async () => {
        normalReadModel.gqlResolvers.UserById = sinon
            .stub()
            .callsFake(normalReadModel.gqlResolvers.UserById);

        const executeQuery = createQueryExecutor({ eventStore, readModel: normalReadModel });
        eventList = eventListForGraphQL.slice(0);

        const getJwt = () => {};
        const graphqlQuery = 'query { UserById(id:2) { id, UserName } }';

        const state = await executeQuery(graphqlQuery, {}, getJwt);

        expect(normalReadModel.gqlResolvers.UserById.lastCall.args[2].getJwt).to.be.equal(getJwt);

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
