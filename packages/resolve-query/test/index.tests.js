import { expect } from 'chai';
import sinon from 'sinon';

import { createFacade, createReadModel, createViewModel } from '../src';

describe('resolve-query', () => {
    let eventStore, eventList, readModelProjection, readModel, viewModelProjection, viewModel;
    let normalGqlFacade, brokenSchemaGqlFacade, brokenResolversGqlFacade, unsubscribe;

    const simulatedEventList = [
        { type: 'UserAdded', aggregateId: '1', payload: { UserName: 'User-1' } },
        { type: 'UserAdded', aggregateId: '2', payload: { UserName: 'User-2' } },
        { type: 'UserAdded', aggregateId: '3', payload: { UserName: 'User-3' } },
        { type: 'UserDeleted', aggregateId: '1' }
    ];

    beforeEach(() => {
        unsubscribe = sinon.stub();
        eventList = [];

        eventStore = {
            subscribeByEventType: sinon.stub().callsFake((matchList, handler) => {
                eventList
                    .filter(event => matchList.includes(event.type))
                    .forEach(event => handler(event));
                return Promise.resolve(unsubscribe);
            }),
            subscribeByAggregateId: sinon.stub().callsFake((matchList, handler) => {
                eventList
                    .filter(event => matchList.includes(event.aggregateId))
                    .forEach(event => handler(event));
                return Promise.resolve(unsubscribe);
            })
        };

        readModelProjection = {
            Init: sinon.stub().callsFake(async (db) => {
                const users = await db.collection('Users');
                await users.find({});
            }),

            UserAdded: sinon.stub().callsFake(async (db, { aggregateId: id, payload }) => {
                const users = await db.collection('Users');
                if ((await users.find({ id })).length !== 0) return;
                await users.insert({ id, UserName: payload.UserName });
            }),

            UserDeleted: sinon.stub().callsFake(async (db, { aggregateId: id }) => {
                const users = await db.collection('Users');
                if ((await users.find({ id })).length === 0) return;
                await users.remove({ id });
            })
        };

        readModel = createReadModel({ eventStore, projection: readModelProjection });

        viewModelProjection = {
            Init: () => [],
            TestEvent: (state, event) => state.concat([event.payload])
        };

        viewModel = createViewModel({ eventStore, projection: viewModelProjection });

        normalGqlFacade = {
            gqlSchema: `
                type User {
                    id: ID!
                    UserName: String
                }
                type Query {
                    UserById(id: ID!): User,
                    UserIds: [ID!],
                    Users: [User]
                }
            `,
            gqlResolvers: {
                UserById: sinon.stub().callsFake(async (db, args) => {
                    const users = await db.collection('Users');
                    const result = await users.find({ id: args.id }).sort({ id: 1 });
                    return result.length > 0 ? result[0] : null;
                }),

                UserIds: sinon.stub().callsFake(async (db) => {
                    const users = await db.collection('Users');
                    const result = await users.find({}, { id: 1, _id: 0 }).sort({ id: 1 });
                    return result.map(({ id }) => id);
                }),

                Users: sinon.stub().callsFake(async (db) => {
                    const users = await db.collection('Users');
                    const result = await users.find({}).sort({ id: 1 });
                    return result;
                })
            }
        };

        brokenSchemaGqlFacade = {
            gqlSchema: 'BROKEN_GRAPHQL_SCHEMA_READ_MODEL_NAME'
        };

        brokenResolversGqlFacade = {
            gqlSchema: 'type Query { Broken: String }',
            gqlResolvers: {
                Broken: () => {
                    throw new Error('BROKEN_GRAPHQL_RESOLVER_READ_MODEL_NAME');
                }
            }
        };
    });

    afterEach(() => {
        normalGqlFacade = null;
        brokenSchemaGqlFacade = null;
        brokenResolversGqlFacade = null;
        viewModel = null;
        readModel = null;
        eventStore = null;
        eventList = null;
    });

    it('should support custom defined resolver without argument', async () => {
        const facade = createFacade({ model: readModel, ...normalGqlFacade });
        const executeQueryGraphql = facade.graphql;
        eventList = simulatedEventList.slice(0);

        const state = await executeQueryGraphql('query { UserIds }');

        expect(state).to.be.deep.equal({
            UserIds: ['2', '3']
        });
    });

    it('should support custom defined resolver with arguments', async () => {
        const facade = createFacade({ model: readModel, ...normalGqlFacade });
        const executeQueryGraphql = facade.graphql;
        eventList = simulatedEventList.slice(0);

        const graphqlQuery = 'query { UserById(id:2) { id, UserName } }';

        const state = await executeQueryGraphql(graphqlQuery);

        expect(state).to.be.deep.equal({
            UserById: {
                UserName: 'User-2',
                id: '2'
            }
        });
    });

    // eslint-disable-next-line max-len
    it('should support custom defined resolver with arguments valued by variables', async () => {
        const facade = createFacade({ model: readModel, ...normalGqlFacade });
        const executeQueryGraphql = facade.graphql;
        eventList = simulatedEventList.slice(0);

        const graphqlQuery = 'query ($testId: ID!) { UserById(id: $testId) { id, UserName } }';

        const state = await executeQueryGraphql(graphqlQuery, { testId: '3' });

        expect(state).to.be.deep.equal({
            UserById: {
                UserName: 'User-3',
                id: '3'
            }
        });
    });

    // eslint-disable-next-line max-len
    it('should handle error in case of wrong arguments for custom defined resolver', async () => {
        const facade = createFacade({ model: readModel, ...normalGqlFacade });
        const executeQueryGraphql = facade.graphql;
        eventList = simulatedEventList.slice(0);

        const graphqlQuery = 'query { UserById() { id, UserName } }';

        try {
            await executeQueryGraphql(graphqlQuery);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error.message).to.have.string('Syntax Error GraphQL request');
            expect(error.message).to.have.string('UserById');
        }
    });

    it('should handle custom GraphQL syntax errors in query', async () => {
        const facade = createFacade({ model: readModel, ...normalGqlFacade });
        const executeQueryGraphql = facade.graphql;
        eventList = simulatedEventList.slice(0);

        const graphqlQuery = 'WRONG_QUERY';

        try {
            await executeQueryGraphql(graphqlQuery);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error.message).to.have.string('Syntax Error GraphQL request');
            expect(error.message).to.have.string('Unexpected Name');
            expect(error.message).to.have.string('WRONG_QUERY');
        }
    });

    it('should raise error in case of invalid GraphQL schema for read-model', async () => {
        try {
            createFacade({ model: readModel, ...brokenSchemaGqlFacade });
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error.message).to.have.string('Syntax Error GraphQL request');
            expect(error.message).to.have.string('BROKEN_GRAPHQL_SCHEMA_READ_MODEL_NAME');
        }
    });

    it('should raise error in case throwing expection into custom resolver', async () => {
        const facade = createFacade({ model: readModel, ...brokenResolversGqlFacade });
        const executeQueryGraphql = facade.graphql;
        eventList = [];

        const graphqlQuery = 'query SomeQuery { Broken }';

        try {
            await executeQueryGraphql(graphqlQuery);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error[0].message).to.have.string('BROKEN_GRAPHQL_RESOLVER_READ_MODEL_NAME');
            expect(error[0].path).to.be.deep.equal(['Broken']);
        }
    });

    it('should provide security context to graphql resolvers', async () => {
        const facade = createFacade({ model: readModel, ...normalGqlFacade });
        const executeQueryGraphql = facade.graphql;
        eventList = simulatedEventList.slice(0);

        const getJwt = () => {};
        const graphqlQuery = 'query { UserById(id:2) { id, UserName } }';

        const state = await executeQueryGraphql(graphqlQuery, {}, getJwt);

        expect(normalGqlFacade.gqlResolvers.UserById.lastCall.args[2].getJwt).to.be.equal(getJwt);

        expect(state).to.be.deep.equal({
            UserById: {
                UserName: 'User-2',
                id: '2'
            }
        });
    });

    it('should support read-model without facade', async () => {
        eventList = simulatedEventList.slice(0);
        await readModel();

        expect(readModelProjection.UserAdded.callCount).to.be.equal(3);
        expect(readModelProjection.UserDeleted.callCount).to.be.equal(1);
    });

    it('should support read-only models without projection function', async () => {
        const storedState = { Users: [{ id: '0', UserName: 'Test' }] };
        const localAdapter = {
            init: () => ({
                getReadable: async () => ({
                    collection: async name => ({
                        find: () => ({
                            sort: async () => storedState[name].sort()
                        })
                    })
                }),
                getError: async () => null
            })
        };
        const readOnlyModel = createReadModel({
            eventStore,
            projection: null,
            adapter: localAdapter
        });
        const facade = createFacade({ model: readOnlyModel, ...normalGqlFacade });
        const executeQueryGraphql = facade.graphql;

        const state = await executeQueryGraphql('query { Users { id, UserName } }');

        expect(state).to.be.deep.equal(storedState);
    });

    it('should support view-models with redux-like projection functions', async () => {
        const facade = createFacade({ model: viewModel });
        const executeQueryState = facade.raw;

        const testEvent = {
            type: 'TestEvent',
            aggregateId: 'test-id',
            payload: 'test-payload'
        };
        eventList = [testEvent];

        const state = await executeQueryState(['test-id']);

        expect(state).to.be.deep.equal(['test-payload']);
    });

    // eslint-disable-next-line max-len
    it('should raise error in case of if view-model\'s aggregateIds argument absence', async () => {
        const facade = createFacade({ model: viewModel });
        const executeQueryState = facade.raw;

        const testEvent = {
            type: 'TestEvent',
            aggregateId: 'test-id',
            payload: 'test-payload'
        };
        eventList = [testEvent];

        try {
            await executeQueryState();
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error.message).to.have.string(
                'View models are build up only with aggregateIds array argument'
            );
        }
    });

    it('should fail on view-models with non-redux-like projection functions', async () => {
        const wrongViewModel = createViewModel({
            eventStore,
            projection: {
                TestEvent: async () => null
            }
        });

        const facade = createFacade({ model: wrongViewModel });
        const executeQueryState = facade.raw;

        eventList = [
            {
                type: 'TestEvent',
                aggregateId: 'test-id'
            }
        ];

        try {
            await executeQueryState(['test-id']);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error.message).to.have.string(
                'Projection function cannot be asyncronous or return Promise object'
            );
        }
    });
});
