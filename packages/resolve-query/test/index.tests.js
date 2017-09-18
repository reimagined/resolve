import { expect } from 'chai';
import Immutable from 'seamless-immutable';
import isPlainObject from 'is-plain-object';
import sinon from 'sinon';

import createQueryExecutor from '../src';

describe('resolve-query', () => {
    let eventStore, eventList, readModel, brokenSchemaModel, brokenResolversModel, viewModel;

    const eventListForGraphQL = [
        { type: 'InitialEvent', aggregateId: 'INITIAL', payload: { Users: [] } },
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

        viewModel = {
            name: 'NORMAL_VIEW_MODEL_NAME',
            eventHandlers: {
                InitialEvent: sinon
                    .stub()
                    .callsFake((_, { payload: initialState }) => Immutable(initialState)),

                UserAdded: sinon
                    .stub()
                    .callsFake(
                        (state, { aggregateId: id, payload: { UserName } }) =>
                            state && state.Users && !state.Users.find(user => user.id === id)
                                ? state.setIn(['Users'], state.Users.concat([{ id, UserName }]))
                                : state
                    ),

                UserDeleted: sinon
                    .stub()
                    .callsFake(
                        (state, { aggregateId: id }) =>
                            state && state.Users
                                ? state.setIn(['Users'], state.Users.without(id))
                                : state
                    )
            }
        };

        readModel = {
            name: 'NORMAL_READ_MODEL_NAME',
            eventHandlers: {
                InitialEvent: sinon.stub().callsFake(async (_, { payload: initialState }) => {
                    if (!isPlainObject(initialState)) {
                        throw new Error('Initial state should be plain object');
                    }
                    return initialState;
                }),

                UserAdded: sinon
                    .stub()
                    .callsFake(async (state, { aggregateId: id, payload: { UserName } }) => {
                        if (!await state.Users.find(user => user.id === id)) {
                            await state.Users.push({ id, UserName });
                        }
                        return state;
                    }),

                UserDeleted: sinon.stub().callsFake(async (state, { aggregateId: id }) => {
                    const userPos = await state.Users.findIndex(user => user.id === id);
                    if (userPos > -1) {
                        await state.Users.splice(userPos, 1);
                    }
                    return state;
                })
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
                UserByIdOnDemand: sinon.stub().callsFake(async (read, args) => {
                    if (!args.aggregateId) throw new Error('aggregateId is mandatory');
                    const { Users } = await read({ aggregateIds: ['INITIAL', args.aggregateId] });
                    return Users.find(user => user.id === args.aggregateId);
                }),
                UserById: sinon.stub().callsFake(async (read, args) => {
                    const { Users } = await read();
                    return Users.find(user => user.id === args.id);
                }),
                UserIds: sinon.stub().callsFake(async (read, args) => {
                    const { Users } = await read();
                    return Users.map(user => user.id);
                }),
                Users: sinon.stub().callsFake(async (read, args) => {
                    const { Users } = await read();
                    return Users;
                })
            }
        };

        brokenSchemaModel = {
            name: 'BROKEN_GRAPHQL_SCHEMA_READ_MODEL_NAME',
            eventHandlers: {},
            gqlSchema: 'BROKEN_GRAPHQL_SCHEMA_READ_MODEL_NAME'
        };

        brokenResolversModel = {
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
        brokenResolversModel = null;
        brokenSchemaModel = null;
        readModel = null;
        eventStore = null;
        eventList = null;
    });

    it('should support custom defined resolver without argument', async () => {
        const executeQuery = createQueryExecutor({ eventStore, readModel: readModel });
        eventList = eventListForGraphQL.slice(0);

        const state = await executeQuery('query { UserIds }');

        expect(state).to.be.deep.equal({
            UserIds: ['2', '3']
        });
    });

    it('should support custom defined resolver with arguments', async () => {
        const executeQuery = createQueryExecutor({ eventStore, readModel: readModel });
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
        const executeQuery = createQueryExecutor({ eventStore, readModel: readModel });
        eventList = eventListForGraphQL.slice(0);

        const graphqlQuery = 'query { UserByIdOnDemand(aggregateId:2) { id, UserName } }';

        const state = await executeQuery(graphqlQuery);

        expect(readModel.eventHandlers.UserAdded.callCount).to.be.equal(1);
        expect(readModel.eventHandlers.UserDeleted.callCount).to.be.equal(0);

        expect(state).to.be.deep.equal({
            UserByIdOnDemand: {
                UserName: 'User-2',
                id: '2'
            }
        });
    });

    it('should support custom defined resolver with arguments valued by variables', async () => {
        const executeQuery = createQueryExecutor({ eventStore, readModel: readModel });
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
        const executeQuery = createQueryExecutor({ eventStore, readModel: readModel });
        eventList = eventListForGraphQL.slice(0);

        const graphqlQuery =
            'query ($testId: ID!) { UserByIdOnDemand(aggregateId: $testId) { id, UserName } }';

        const state = await executeQuery(graphqlQuery, { testId: '3' });

        expect(readModel.eventHandlers.UserAdded.callCount).to.be.equal(1);
        expect(readModel.eventHandlers.UserDeleted.callCount).to.be.equal(0);

        expect(state).to.be.deep.equal({
            UserByIdOnDemand: {
                UserName: 'User-3',
                id: '3'
            }
        });
    });

    it('should handle error in case of wrong arguments for custom defined resolver', async () => {
        const executeQuery = createQueryExecutor({ eventStore, readModel: readModel });
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
        const executeQuery = createQueryExecutor({ eventStore, readModel: readModel });
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
            createQueryExecutor({ eventStore, readModel: brokenSchemaModel });
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error.message).to.have.string('Syntax Error GraphQL request');
            expect(error.message).to.have.string('BROKEN_GRAPHQL_SCHEMA_READ_MODEL_NAME');
        }
    });

    it('should raise error in case throwing expection into custom resolver', async () => {
        const executeQuery = createQueryExecutor({
            eventStore,
            readModel: brokenResolversModel
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

    it('should provide security context to event handlers', async () => {
        const executeQuery = createQueryExecutor({ eventStore, readModel: readModel });
        eventList = eventListForGraphQL.slice(0);

        const getJwt = () => {};
        const graphqlQuery = 'query { UserById(id:2) { id, UserName } }';

        const state = await executeQuery(graphqlQuery, {}, getJwt);

        expect(readModel.gqlResolvers.UserById.lastCall.args[2].getJwt).to.be.equal(getJwt);

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
