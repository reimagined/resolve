import { expect } from 'chai';
import Immutable from 'seamless-immutable';
import sinon from 'sinon';

import createQueryExecutor from '../src';

describe('resolve-query', () => {
    let eventStore, eventList, readModel, brokenSchemaModel, brokenResolversModel, viewModel;

    const simulatedEventList = [
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
            viewModel: true,
            projection: {
                UserAdded: sinon.stub().callsFake((state, { aggregateId: id, payload }) => {
                    let newState = state;
                    if (!state || !state.Users) {
                        newState = Immutable({ Users: [] });
                    }
                    if (!newState.Users.find(user => user.id === id)) {
                        newState = newState.setIn(
                            ['Users'],
                            newState.Users.concat([{ id, UserName: payload.UserName }])
                        );
                    }
                    return newState;
                }),

                UserDeleted: sinon.stub().callsFake((state, { aggregateId: id }) => {
                    let newState = state;
                    if (!state || !state.Users) {
                        newState = Immutable({ Users: [] });
                    }
                    newState = newState.setIn(
                        ['Users'],
                        newState.Users.filter(user => user.id !== id)
                    );
                    return newState;
                })
            }
        };

        readModel = {
            projection: {
                UserAdded: sinon.stub().callsFake(async (state, { aggregateId: id, payload }) => {
                    const newState = state && state.Users ? state : { Users: [] };
                    if (!await newState.Users.find(user => user.id === id)) {
                        await newState.Users.push({ id, UserName: payload.UserName });
                    }
                    return newState;
                }),

                UserDeleted: sinon.stub().callsFake(async (state, { aggregateId: id }) => {
                    const newState = state && state.Users ? state : { Users: [] };
                    const userPos = await newState.Users.findIndex(user => user.id === id);
                    if (userPos > -1) {
                        await newState.Users.splice(userPos, 1);
                    }
                    return newState;
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
                    const { Users } = await read([args.aggregateId]);

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
            projection: {},
            gqlSchema: 'BROKEN_GRAPHQL_SCHEMA_READ_MODEL_NAME'
        };

        brokenResolversModel = {
            projection: {},
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
        viewModel = null;
        eventStore = null;
        eventList = null;
    });

    describe('Read model', () => {
        it('should support custom defined resolver without argument', async () => {
            const executeQuery = createQueryExecutor({ eventStore, readModel });
            eventList = simulatedEventList.slice(0);

            const state = await executeQuery('query { UserIds }');

            expect(state).to.be.deep.equal({
                UserIds: ['2', '3']
            });
        });

        it('should support custom defined resolver with arguments', async () => {
            const executeQuery = createQueryExecutor({ eventStore, readModel });
            eventList = simulatedEventList.slice(0);

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
            const executeQuery = createQueryExecutor({ eventStore, readModel });
            eventList = simulatedEventList.slice(0);

            const graphqlQuery = 'query { UserByIdOnDemand(aggregateId:2) { id, UserName } }';

            const state = await executeQuery(graphqlQuery);

            expect(readModel.projection.UserAdded.callCount).to.be.equal(1);
            expect(readModel.projection.UserDeleted.callCount).to.be.equal(0);

            expect(state).to.be.deep.equal({
                UserByIdOnDemand: {
                    UserName: 'User-2',
                    id: '2'
                }
            });
        });

        // eslint-disable-next-line max-len
        it('should support custom defined resolver with arguments valued by variables', async () => {
            const executeQuery = createQueryExecutor({ eventStore, readModel });
            eventList = simulatedEventList.slice(0);

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
            const executeQuery = createQueryExecutor({ eventStore, readModel });
            eventList = simulatedEventList.slice(0);

            const graphqlQuery =
                'query ($testId: ID!) { UserByIdOnDemand(aggregateId: $testId) { id, UserName } }';

            const state = await executeQuery(graphqlQuery, { testId: '3' });

            expect(readModel.projection.UserAdded.callCount).to.be.equal(1);
            expect(readModel.projection.UserDeleted.callCount).to.be.equal(0);

            expect(state).to.be.deep.equal({
                UserByIdOnDemand: {
                    UserName: 'User-3',
                    id: '3'
                }
            });
        });

        // eslint-disable-next-line max-len
        it('should handle error in case of wrong arguments for custom defined resolver', async () => {
            const executeQuery = createQueryExecutor({ eventStore, readModel });
            eventList = simulatedEventList.slice(0);

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
            const executeQuery = createQueryExecutor({ eventStore, readModel });
            eventList = simulatedEventList.slice(0);

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

        it('should provide security context to graphql resolvers', async () => {
            const executeQuery = createQueryExecutor({ eventStore, readModel });
            eventList = simulatedEventList.slice(0);

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
    });

    describe('View model', () => {
        it('should provide whole state in View query', async () => {
            const executeQuery = createQueryExecutor({ eventStore, readModel: viewModel });
            eventList = simulatedEventList.slice(0);

            const state = await executeQuery('query { View }');

            expect(state).to.be.deep.equal({
                Users: [
                    {
                        UserName: 'User-2',
                        id: '2'
                    },
                    {
                        UserName: 'User-3',
                        id: '3'
                    }
                ]
            });
        });

        it('should provide on-demain state in View query with string parameters', async () => {
            const executeQuery = createQueryExecutor({ eventStore, readModel: viewModel });
            eventList = simulatedEventList.slice(0);

            const state = await executeQuery('query { View(aggregateId: 2) }');

            expect(state).to.be.deep.equal({
                Users: [
                    {
                        UserName: 'User-2',
                        id: '2'
                    }
                ]
            });
        });

        it('should provide on-demain state in View query with variable parameters', async () => {
            const executeQuery = createQueryExecutor({ eventStore, readModel: viewModel });
            eventList = simulatedEventList.slice(0);

            const state = await executeQuery('query ($id: ID!) { View(aggregateId: $id) }', {
                id: '2'
            });

            expect(state).to.be.deep.equal({
                Users: [
                    {
                        UserName: 'User-2',
                        id: '2'
                    }
                ]
            });
        });

        it('should fail if manual graphql schema is provided', async () => {
            viewModel.gqlSchema = 'SCHEMA';
            try {
                createQueryExecutor({ eventStore, readModel: viewModel });
                return Promise.reject('TEST FAILED');
            } catch (error) {
                expect(error.message).to.have.string(
                    'View model can\'t have GraphQL schemas and resolvers'
                );
            }
        });

        it('should fail if manual graphql resolvers is provided', async () => {
            viewModel.gqlResolvers = { Resolver: () => null };
            try {
                createQueryExecutor({ eventStore, readModel: viewModel });
                return Promise.reject('TEST FAILED');
            } catch (error) {
                expect(error.message).to.have.string(
                    'View model can\'t have GraphQL schemas and resolvers'
                );
            }
        });
    });

    it('works the same way for different import types', () => {
        expect(createQueryExecutor).to.be.equal(require('../src'));
    });
});
