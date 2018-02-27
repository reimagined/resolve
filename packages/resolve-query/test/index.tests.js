import { expect } from 'chai'
import sinon from 'sinon'

import { createFacade, createReadModel, createViewModel } from '../src'

describe('resolve-query', () => {
  let eventStore, readModelProjection, readModel, viewModelProjection, viewModel
  let normalGqlFacade,
    brokenSchemaGqlFacade,
    brokenResolversGqlFacade,
    unsubscribe
  let eventList, delayedEventList, resolveDelayedEvents, delayedHandlersPromise

  const simulatedEventList = [
    { type: 'UserAdded', aggregateId: '1', payload: { UserName: 'User-1' } },
    { type: 'UserAdded', aggregateId: '2', payload: { UserName: 'User-2' } },
    { type: 'UserAdded', aggregateId: '3', payload: { UserName: 'User-3' } },
    { type: 'UserDeleted', aggregateId: '1' }
  ]

  beforeEach(() => {
    const delayedEventsPromise = new Promise(
      resolve => (resolveDelayedEvents = resolve)
    )
    let resolveDelayedHandlers = null
    delayedHandlersPromise = new Promise(
      resolve => (resolveDelayedHandlers = resolve)
    )
    unsubscribe = sinon.stub()
    delayedEventList = []
    eventList = []

    const subscribeByAnyField = async (fieldName, matchList, handler) => {
      for (let event of eventList) {
        if (event[fieldName] && !matchList.includes(event[fieldName])) continue
        await Promise.resolve()
        handler(event)
      }

      delayedEventsPromise.then(async () => {
        for (let event of delayedEventList) {
          if (event[fieldName] && !matchList.includes(event[fieldName]))
            continue
          await Promise.resolve()
          handler(event)
        }
      })

      return unsubscribe
    }

    eventStore = {
      subscribeByEventType: sinon
        .stub()
        .callsFake(subscribeByAnyField.bind(null, 'type')),
      subscribeByAggregateId: sinon
        .stub()
        .callsFake(subscribeByAnyField.bind(null, 'aggregateId'))
    }

    readModelProjection = {
      Init: sinon.stub().callsFake(async store => {
        await store.defineStorage('Users', [
          { name: 'id', type: 'string', index: 'primary' },
          { name: 'UserName', type: 'string' }
        ])
      }),

      UserAdded: sinon
        .stub()
        .callsFake(async (store, { aggregateId: id, payload }) => {
          if ((await store.find('Users', { id }, {})).length > 0) {
            return
          }
          await store.insert('Users', { id, UserName: payload.UserName })
        }),

      UserDeleted: sinon
        .stub()
        .callsFake(async (store, { aggregateId: id }) => {
          if ((await store.find('Users', { id }, {})).length === 0) {
            return
          }
          await store.delete('Users', { id })
        }),

      FailureEvent: sinon
        .stub()
        .callsFake(async (store, { aggregateId: id }) => {
          throw new Error('Failure')
        }),

      LastBusEvent: sinon
        .stub()
        .callsFake(async (store, { aggregateId: id }) => {
          resolveDelayedHandlers()
          await Promise.resolve()
        })
    }

    readModel = createReadModel({ eventStore, projection: readModelProjection })

    viewModelProjection = {
      Init: sinon.stub().callsFake(() => []),
      TestEvent: sinon
        .stub()
        .callsFake((state, event) => state.concat([event.payload]))
    }

    viewModel = createViewModel({ eventStore, projection: viewModelProjection })

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
        UserById: sinon.stub().callsFake(async (store, args) => {
          const matchedUsers = await store.find('Users', { id: args.id })
          if (!Array.isArray(matchedUsers) || matchedUsers.length < 1) {
            return null
          }
          return matchedUsers[0]
        }),

        UserIds: sinon.stub().callsFake(async store => {
          const result = await store.find('Users', {}, { id: 1 }, { id: 1 })
          return result.map(({ id }) => id)
        }),

        Users: sinon.stub().callsFake(async store => {
          return await store.find('Users', {}, null, { id: 1 })
        })
      }
    }

    brokenSchemaGqlFacade = {
      gqlSchema: 'BROKEN_GRAPHQL_SCHEMA_READ_MODEL_NAME'
    }

    brokenResolversGqlFacade = {
      gqlSchema: 'type Query { Broken: String }',
      gqlResolvers: {
        Broken: () => {
          throw new Error('BROKEN_GRAPHQL_RESOLVER_READ_MODEL_NAME')
        }
      }
    }
  })

  afterEach(() => {
    resolveDelayedEvents = null
    delayedHandlersPromise = null
    normalGqlFacade = null
    brokenSchemaGqlFacade = null
    brokenResolversGqlFacade = null
    viewModel = null
    readModel = null
    eventStore = null
    delayedEventList = null
    eventList = null
    unsubscribe = null
  })

  it('should support custom defined resolver without argument', async () => {
    const { executeQueryGraphql } = createFacade({
      model: readModel,
      ...normalGqlFacade
    })
    eventList = simulatedEventList.slice(0)

    const state = await executeQueryGraphql('query { UserIds }')

    expect(state).to.be.deep.equal({
      UserIds: ['2', '3']
    })
  })

  it('should support custom defined resolver without argument on subsequent call', async () => {
    const { executeQueryGraphql } = createFacade({
      model: readModel,
      ...normalGqlFacade
    })
    eventList = simulatedEventList.slice(0)

    await executeQueryGraphql('query { UserIds }')
    const state = await executeQueryGraphql('query { UserIds }')

    expect(state).to.be.deep.equal({
      UserIds: ['2', '3']
    })
  })

  it('should support custom defined resolver without argument for bus events', async () => {
    const { executeQueryGraphql } = createFacade({
      model: readModel,
      ...normalGqlFacade
    })
    eventList = simulatedEventList.slice(0)
    delayedEventList = [
      { type: 'UserAdded', aggregateId: '4', payload: { UserName: 'User-4' } },
      { type: 'LastBusEvent', aggregateId: '0' }
    ]

    const firstState = await executeQueryGraphql('query { UserIds }')
    resolveDelayedEvents()
    await delayedHandlersPromise
    const secondState = await executeQueryGraphql('query { UserIds }')

    expect(firstState).to.be.deep.equal({
      UserIds: ['2', '3']
    })

    expect(secondState).to.be.deep.equal({
      UserIds: ['2', '3', '4']
    })
  })

  it('should support custom defined resolver with arguments', async () => {
    const { executeQueryGraphql } = createFacade({
      model: readModel,
      ...normalGqlFacade
    })
    eventList = simulatedEventList.slice(0)

    const graphqlQuery = 'query { UserById(id:2) { id, UserName } }'

    const state = await executeQueryGraphql(graphqlQuery)

    expect(state).to.be.deep.equal({
      UserById: {
        UserName: 'User-2',
        id: '2'
      }
    })
  })

  // eslint-disable-next-line max-len
  it('should support custom defined resolver with arguments valued by variables', async () => {
    const { executeQueryGraphql } = createFacade({
      model: readModel,
      ...normalGqlFacade
    })
    eventList = simulatedEventList.slice(0)

    const graphqlQuery =
      'query ($testId: ID!) { UserById(id: $testId) { id, UserName } }'

    const state = await executeQueryGraphql(graphqlQuery, { testId: '3' })

    expect(state).to.be.deep.equal({
      UserById: {
        UserName: 'User-3',
        id: '3'
      }
    })
  })

  // eslint-disable-next-line max-len
  it('should handle error in case of wrong arguments for custom defined resolver', async () => {
    const { executeQueryGraphql } = createFacade({
      model: readModel,
      ...normalGqlFacade
    })
    eventList = simulatedEventList.slice(0)

    const graphqlQuery = 'query { UserById() { id, UserName } }'

    try {
      await executeQueryGraphql(graphqlQuery)
      return Promise.reject('Test failed')
    } catch (error) {
      expect(error.message).to.have.string('Syntax Error GraphQL request')
      expect(error.message).to.have.string('UserById')
    }
  })

  it('should handle custom GraphQL syntax errors in query', async () => {
    const { executeQueryGraphql } = createFacade({
      model: readModel,
      ...normalGqlFacade
    })
    eventList = simulatedEventList.slice(0)

    const graphqlQuery = 'WRONG_QUERY'

    try {
      await executeQueryGraphql(graphqlQuery)
      return Promise.reject('Test failed')
    } catch (error) {
      expect(error.message).to.have.string('Syntax Error GraphQL request')
      expect(error.message).to.have.string('Unexpected Name')
      expect(error.message).to.have.string('WRONG_QUERY')
    }
  })

  it('should raise error in case of invalid GraphQL schema for read-model', async () => {
    try {
      createFacade({ model: readModel, ...brokenSchemaGqlFacade })
      return Promise.reject('Test failed')
    } catch (error) {
      expect(error.message).to.have.string('Syntax Error GraphQL request')
      expect(error.message).to.have.string(
        'BROKEN_GRAPHQL_SCHEMA_READ_MODEL_NAME'
      )
    }
  })

  it('should raise error in case throwing expection into custom resolver', async () => {
    const { executeQueryGraphql } = createFacade({
      model: readModel,
      ...brokenResolversGqlFacade
    })
    eventList = []

    const graphqlQuery = 'query SomeQuery { Broken }'

    try {
      await executeQueryGraphql(graphqlQuery)
      return Promise.reject('Test failed')
    } catch (error) {
      expect(error[0].message).to.have.string(
        'BROKEN_GRAPHQL_RESOLVER_READ_MODEL_NAME'
      )
      expect(error[0].path).to.be.deep.equal(['Broken'])
    }
  })

  it('should provide security context to graphql resolvers', async () => {
    const { executeQueryGraphql } = createFacade({
      model: readModel,
      ...normalGqlFacade
    })
    eventList = simulatedEventList.slice(0)

    const jwtToken = 'JWT-TOKEN'
    const graphqlQuery = 'query { UserById(id:2) { id, UserName } }'
    const state = await executeQueryGraphql(graphqlQuery, {}, jwtToken)

    expect(
      normalGqlFacade.gqlResolvers.UserById.lastCall.args[2].jwtToken
    ).to.be.equal(jwtToken)

    expect(state).to.be.deep.equal({
      UserById: {
        UserName: 'User-2',
        id: '2'
      }
    })
  })

  it('should support read-model without facade', async () => {
    eventList = simulatedEventList.slice(0)
    await readModel()

    expect(readModelProjection.UserAdded.callCount).to.be.equal(3)
    expect(readModelProjection.UserDeleted.callCount).to.be.equal(1)
  })

  it('should support read-only models without projection function', async () => {
    const storedState = { Users: [{ id: '0', UserName: 'Test' }] }
    const localAdapter = {
      init: () => ({
        getReadable: async () => ({
          find: async () => storedState.Users
        }),
        getError: async () => null
      })
    }
    const readOnlyModel = createReadModel({
      eventStore,
      projection: null,
      adapter: localAdapter
    })
    const { executeQueryGraphql } = createFacade({
      model: readOnlyModel,
      ...normalGqlFacade
    })

    const state = await executeQueryGraphql('query { Users { id, UserName } }')

    expect(state).to.be.deep.equal(storedState)
  })

  // eslint-disable-next-line max-len
  it('should support custom resolver on facade', async () => {
    const { executeQueryCustom } = createFacade({
      model: readModel,
      customResolvers: {
        FindUser: async (model, { id }) => {
          const store = await model()
          const matchedUsers = await store.find('Users', { id })
          if (!Array.isArray(matchedUsers) || matchedUsers.length === 0) {
            return null
          }
          return matchedUsers[0]
        }
      }
    })
    eventList = simulatedEventList.slice(0)

    const state = await executeQueryCustom('FindUser', { id: '3' })

    expect(state.UserName).to.be.equal('User-3')
    expect(state.id).to.be.equal('3')
  })

  it('should handle exceptions in projection functions', async () => {
    const { executeQueryGraphql } = createFacade({
      model: readModel,
      ...normalGqlFacade
    })
    eventList = [{ type: 'FailureEvent', aggregateId: '1' }]

    try {
      await executeQueryGraphql('query { UserIds }')
      return Promise.reject('Test failed')
    } catch (error) {
      expect(error.message).to.be.equal('Failure')
    }
  })

  // eslint-disable-next-line max-len
  it('should throw error in case of absence invoked custom resolver on facade', async () => {
    const { executeQueryCustom } = createFacade({
      model: readModel,
      customResolvers: {}
    })
    eventList = simulatedEventList.slice(0)

    try {
      await executeQueryCustom('FindUser', { id: '3' })
      return Promise.reject('Test failed')
    } catch (error) {
      expect(error.message).to.be.equal(
        "The 'FindUser' custom resolver is not specified"
      )
    }
  })

  it('should stop read-model building when adapter raise an error', async () => {
    eventList = [
      { type: 'FailureEvent', aggregateId: '1' },
      { type: 'AfterEvent', aggregateId: '2' }
    ]
    delayedEventList = [{ type: 'AfterEvent', aggregateId: '3' }]

    const localAdapter = {
      init: () => ({ getReadable: () => null, getError: () => null }),
      buildProjection: proj => proj
    }

    const localProjection = {
      FailureEvent: sinon.stub().callsFake(() => {
        throw new Error('Syntenic error')
      }),
      AfterEvent: sinon.spy()
    }

    const readOnlyModel = createReadModel({
      eventStore,
      projection: localProjection,
      adapter: localAdapter
    })

    const { executeQueryRaw } = createFacade({ model: readOnlyModel })

    try {
      await executeQueryRaw()
      return Promise.reject('Test failed')
    } catch (error) {
      expect(localProjection.FailureEvent.callCount).to.be.equal(1)
      expect(localProjection.AfterEvent.callCount).to.be.equal(0)

      expect(error.message).to.be.equal('Syntenic error')
      expect(unsubscribe.callCount).to.be.equal(1)
    }
  })

  it('should ignore wrong events in projection while buiding read-model', async () => {
    const { executeQueryGraphql } = createFacade({
      model: readModel,
      ...normalGqlFacade
    })
    eventList = [{ noType: 'noType', noAggregateId: 'noId' }].concat(
      simulatedEventList.slice(0)
    )

    const state = await executeQueryGraphql('query { UserIds }')

    expect(state).to.be.deep.equal({
      UserIds: ['2', '3']
    })
  })

  it('should support read-model disposing', async () => {
    eventList = simulatedEventList.slice(0)
    await readModel()
    readModel.dispose()

    expect(unsubscribe.callCount).to.be.equal(1)
  })

  it('should not perform repeat read-model disposing on following calls', async () => {
    eventList = simulatedEventList.slice(0)
    await readModel()
    readModel.dispose()
    readModel.dispose()

    expect(unsubscribe.callCount).to.be.equal(1)
  })

  it('should support view-models with redux-like projection functions', async () => {
    const { executeQueryRaw } = createFacade({ model: viewModel })

    const testEvent = {
      type: 'TestEvent',
      aggregateId: 'test-id',
      payload: 'test-payload'
    }
    eventList = [testEvent]

    const state = await executeQueryRaw(['test-id'])

    expect(state).to.be.deep.equal(['test-payload'])
  })

  it('should support view-models with many aggregate ids', async () => {
    const { executeQueryRaw } = createFacade({ model: viewModel })

    const testEvent1 = {
      type: 'TestEvent',
      aggregateId: 'test-id-1',
      payload: 'test-payload-1'
    }
    const testEvent2 = {
      type: 'TestEvent',
      aggregateId: 'test-id-2',
      payload: 'test-payload-2'
    }
    eventList = [testEvent1, testEvent2]

    const state1 = await executeQueryRaw(['test-id-1'])
    const state2 = await executeQueryRaw(['test-id-2'])

    expect(state1).to.be.deep.equal(['test-payload-1'])
    expect(state2).to.be.deep.equal(['test-payload-2'])
  })

  it('should support view-models with wildcard aggregate ids', async () => {
    const { executeQueryRaw } = createFacade({ model: viewModel })

    const testEvent1 = {
      type: 'TestEvent',
      aggregateId: 'test-id-1',
      payload: 'test-payload-1'
    }
    const testEvent2 = {
      type: 'TestEvent',
      aggregateId: 'test-id-2',
      payload: 'test-payload-2'
    }
    eventList = [testEvent1, testEvent2]

    const state = await executeQueryRaw('*')

    expect(state).to.be.deep.equal(['test-payload-1', 'test-payload-2'])
  })

  // eslint-disable-next-line max-len
  it("should raise error in case of if view-model's aggregateIds argument absence", async () => {
    const { executeQueryRaw } = createFacade({ model: viewModel })

    const testEvent = {
      type: 'TestEvent',
      aggregateId: 'test-id',
      payload: 'test-payload'
    }
    eventList = [testEvent]

    try {
      await executeQueryRaw()
      return Promise.reject('Test failed')
    } catch (error) {
      expect(error.message).to.have.string(
        'View models are build up only with aggregateIds array or wildcard argument'
      )
    }
  })

  it('should fail on view-models with non-redux/async projection functions', async () => {
    const wrongViewModel = createViewModel({
      eventStore,
      projection: {
        TestEvent: async () => null
      }
    })

    const { executeQueryRaw } = createFacade({ model: wrongViewModel })

    eventList = [
      {
        type: 'TestEvent',
        aggregateId: 'test-id'
      }
    ]

    try {
      await executeQueryRaw(['test-id'])
      return Promise.reject('Test failed')
    } catch (error) {
      expect(error.message).to.have.string(
        'A Projection function cannot be asynchronous or return a Promise object'
      )
    }
  })

  it('should fail on view-models with non-redux/generator projection functions', async () => {
    const wrongViewModel = createViewModel({
      eventStore,
      projection: {
        TestEvent: function*() {}
      }
    })

    const { executeQueryRaw } = createFacade({ model: wrongViewModel })

    eventList = [
      {
        type: 'TestEvent',
        aggregateId: 'test-id'
      }
    ]

    try {
      await executeQueryRaw(['test-id'])
      return Promise.reject('Test failed')
    } catch (error) {
      expect(error.message).to.have.string(
        'A Projection function cannot be a generator or return an iterable object'
      )
    }
  })

  it('should handle view-models error on Init function', async () => {
    const wrongViewModel = createViewModel({
      eventStore,
      projection: {
        Init: () => {
          throw new Error('InitError')
        }
      }
    })

    const { executeQueryRaw } = createFacade({ model: wrongViewModel })

    try {
      await executeQueryRaw('*')
      return Promise.reject('Test failed')
    } catch (error) {
      expect(error.message).to.have.string('InitError')
    }
  })

  it('should handle view-models error on custom event handler function', async () => {
    const wrongViewModel = createViewModel({
      eventStore,
      projection: {
        TestEvent: () => {
          throw new Error('TestEventError')
        }
      }
    })

    const { executeQueryRaw } = createFacade({ model: wrongViewModel })

    eventList = [
      {
        type: 'TestEvent',
        aggregateId: 'test-id-1'
      },
      {
        type: 'TestEvent',
        aggregateId: 'test-id-2'
      }
    ]

    try {
      await executeQueryRaw('*')
      return Promise.reject('Test failed')
    } catch (error) {
      expect(error.message).to.have.string('TestEventError')
    }
  })

  it('should support view-model with caching subscribtion and last state', async () => {
    const { executeQueryRaw } = createFacade({ model: viewModel })

    const testEvent = {
      type: 'TestEvent',
      aggregateId: 'test-id',
      payload: 'test-payload'
    }
    eventList = [testEvent]

    const stateOne = await executeQueryRaw(['test-id'])
    const stateTwo = await executeQueryRaw(['test-id'])

    expect(stateOne).to.be.deep.equal(['test-payload'])
    expect(stateTwo).to.be.deep.equal(['test-payload'])

    expect(viewModelProjection.Init.callCount).to.be.equal(1)
    expect(viewModelProjection.TestEvent.callCount).to.be.equal(1)

    expect(unsubscribe.callCount).to.be.equal(0)
  })

  it('should support view-model disposing by aggregate-id', async () => {
    eventList = simulatedEventList.slice(0)
    await viewModel(['test-aggregate-id'])
    viewModel.dispose('test-aggregate-id')
    viewModel.dispose('test-aggregate-wrong-id')
    await Promise.resolve()

    expect(unsubscribe.callCount).to.be.equal(1)
  })

  it('should support view-model wildcard disposing', async () => {
    eventList = simulatedEventList.slice(0)
    await viewModel(['test-aggregate-id'])
    viewModel.dispose()
    await Promise.resolve()

    expect(unsubscribe.callCount).to.be.equal(1)
  })

  it('should not dispose view-model after it disposed', async () => {
    eventList = simulatedEventList.slice(0)
    await viewModel(['test-aggregate-id'])
    viewModel.dispose()
    viewModel.dispose()
    await Promise.resolve()

    expect(unsubscribe.callCount).to.be.equal(1)
  })
})
