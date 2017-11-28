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
        unsubscribe = null;
    });

    it('should support custom defined resolver without argument', async () => {
        const { executeQueryGraphql } = createFacade({ model: readModel, ...normalGqlFacade });
        eventList = simulatedEventList.slice(0);

        const state = await executeQueryGraphql('query { UserIds }');

        expect(state).to.be.deep.equal({
            UserIds: ['2', '3']
        });
    });

    it('should support custom defined resolver with arguments', async () => {
        const { executeQueryGraphql } = createFacade({ model: readModel, ...normalGqlFacade });
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
        const { executeQueryGraphql } = createFacade({ model: readModel, ...normalGqlFacade });
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
        const { executeQueryGraphql } = createFacade({ model: readModel, ...normalGqlFacade });
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
        const { executeQueryGraphql } = createFacade({ model: readModel, ...normalGqlFacade });
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
        const { executeQueryGraphql } = createFacade({
            model: readModel,
            ...brokenResolversGqlFacade
        });
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
        const { executeQueryGraphql } = createFacade({ model: readModel, ...normalGqlFacade });
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
        const { executeQueryGraphql } = createFacade({ model: readOnlyModel, ...normalGqlFacade });

        const state = await executeQueryGraphql('query { Users { id, UserName } }');

        expect(state).to.be.deep.equal(storedState);
    });

    // eslint-disable-next-line max-len
    it('should support custom resolver on facade', async () => {
        const { executeQueryCustom } = createFacade({
            model: readModel,
            customResolvers: {
                FindUser: async (model, condition) => {
                    const users = await (await model()).collection('Users');
                    return await users.find(condition, { _id: 0 });
                }
            }
        });
        eventList = simulatedEventList.slice(0);

        const state = await executeQueryCustom('FindUser', { id: '3' });

        expect(state).to.be.deep.equal([
            {
                UserName: 'User-3',
                id: '3'
            }
        ]);
    });

    it('should support read-model disposing', async () => {
        eventList = simulatedEventList.slice(0);
        await readModel();
        readModel.dispose();

        expect(unsubscribe.callCount).to.be.equal(1);
    });

    it('should support view-models with redux-like projection functions', async () => {
        const { executeQueryRaw } = createFacade({ model: viewModel });

        const testEvent = {
            type: 'TestEvent',
            aggregateId: 'test-id',
            payload: 'test-payload'
        };
        eventList = [testEvent];

        const state = await executeQueryRaw(['test-id']);

        expect(state).to.be.deep.equal(['test-payload']);
    });

    it('should support view-models with many aggregate ids', async () => {
        const { executeQueryRaw } = createFacade({ model: viewModel });

        const testEvent1 = {
            type: 'TestEvent',
            aggregateId: 'test-id-1',
            payload: 'test-payload-1'
        };
        const testEvent2 = {
            type: 'TestEvent',
            aggregateId: 'test-id-2',
            payload: 'test-payload-2'
        };
        eventList = [testEvent1, testEvent2];

        const state1 = await executeQueryRaw(['test-id-1']);
        const state2 = await executeQueryRaw(['test-id-2']);

        expect(state1).to.be.deep.equal(['test-payload-1']);
        expect(state2).to.be.deep.equal(['test-payload-2']);
    });

    it('should support view-models with wildcard aggregate ids', async () => {
        const { executeQueryRaw } = createFacade({ model: viewModel });

        const testEvent1 = {
            type: 'TestEvent',
            aggregateId: 'test-id-1',
            payload: 'test-payload-1'
        };
        const testEvent2 = {
            type: 'TestEvent',
            aggregateId: 'test-id-2',
            payload: 'test-payload-2'
        };
        eventList = [testEvent1, testEvent2];

        const state = await executeQueryRaw('*');

        expect(state).to.be.deep.equal(['test-payload-1', 'test-payload-2']);
    });

    // eslint-disable-next-line max-len
    it('should raise error in case of if view-model\'s aggregateIds argument absence', async () => {
        const { executeQueryRaw } = createFacade({ model: viewModel });

        const testEvent = {
            type: 'TestEvent',
            aggregateId: 'test-id',
            payload: 'test-payload'
        };
        eventList = [testEvent];

        try {
            await executeQueryRaw();
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error.message).to.have.string(
                'View models are build up only with aggregateIds array or wildcard argument'
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

        const { executeQueryRaw } = createFacade({ model: wrongViewModel });

        eventList = [
            {
                type: 'TestEvent',
                aggregateId: 'test-id'
            }
        ];

        try {
            await executeQueryRaw(['test-id']);
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error.message).to.have.string(
                'A Projection function cannot be asynchronous or return a Promise object'
            );
        }
    });

    it('should support view-model disposing', async () => {
        eventList = simulatedEventList.slice(0);
        await viewModel(['test-aggregate-id']);
        viewModel.dispose();

        expect(unsubscribe.callCount).to.be.equal(1);
    });
});
