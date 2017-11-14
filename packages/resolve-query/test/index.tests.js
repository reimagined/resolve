import { expect } from 'chai';
import sinon from 'sinon';

import createQueryExecutor from '../src';

describe('resolve-query', () => {
    let eventStore, eventList, projection, readModel, brokenSchemaModel, brokenResolversModel;

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

        projection = {
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

        readModel = {
            projection,
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
        eventStore = null;
        eventList = null;
    });

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

    it('should support update-only models with projection function', async () => {
        const updateModel = { projection };
        const executeQuery = createQueryExecutor({ eventStore, readModel: updateModel });
        eventList = simulatedEventList.slice(0);

        await executeQuery();

        expect(updateModel.projection.UserAdded.callCount).to.be.equal(3);
        expect(updateModel.projection.UserDeleted.callCount).to.be.equal(1);
    });

    it('should support read-only models without projection function', async () => {
        const storedState = { Users: [{ id: '0', UserName: 'Test' }] };
        const readOnlyModel = {
            ...readModel,
            projection: null,
            adapter: {
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
            }
        };
        const executeQuery = createQueryExecutor({ eventStore, readModel: readOnlyModel });

        const state = await executeQuery('query { Users { id, UserName } }');

        expect(state).to.be.deep.equal(storedState);
    });

    it('works the same way for different import types', () => {
        expect(createQueryExecutor).to.be.equal(require('../src'));
    });
});
