import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import givenEvents from 'resolve-testing-tools'
import resetReadModel from '../reset-read-model'

import config from './config'

describe('Read-model generic adapter API', () => {
  const {
    name,
    resolvers: resolversModule,
    projection: projectionModule,
    connectorName
  } = config.readModels.find(({ name }) => name === 'Advanced')
  const {
    module: connectorModule,
    options: connectorOptions
  } = config.readModelConnectors[connectorName]

  const createConnector = interopRequireDefault(require(connectorModule))
    .default

  const projection = interopRequireDefault(require(`./${projectionModule}`))
    .default
  const resolvers = interopRequireDefault(require(`./${resolversModule}`))
    .default

  let adapter = null
  beforeEach(async () => {
    await resetReadModel(createConnector, connectorOptions, name)
    adapter = createConnector(connectorOptions)
  })
  afterEach(async () => {
    await resetReadModel(createConnector, connectorOptions, name)
    adapter = null
  })

  test('Insert and non-parameterized resolver invocation', async () => {
    const result = await givenEvents([
      {
        aggregateId: 'ID',
        type: 'INSERT_TEST',
        timestamp: 100,
        payload: 'test'
      }
    ])
      .readModel({
        name,
        projection,
        resolvers,
        adapter
      })
      .NON_PARAMETERIZED_RESOLVER_TEST({})

    expect(result).toMatchSnapshot()
  })

  test('Update and non-parameterized resolver invocation', async () => {
    const result = await givenEvents([
      {
        aggregateId: 'ID',
        type: 'INSERT_TEST',
        timestamp: 100,
        payload: 'test'
      },
      {
        aggregateId: 'ID',
        type: 'UPDATE_TEST',
        timestamp: 101,
        payload: 'test'
      }
    ])
      .readModel({
        name,
        projection,
        resolvers,
        adapter
      })
      .NON_PARAMETERIZED_RESOLVER_TEST({})

    expect(result).toMatchSnapshot()
  })

  test('Upsert and non-parameterized resolver invocation', async () => {
    const result = await givenEvents([
      {
        aggregateId: 'ID',
        type: 'INSERT_TEST',
        timestamp: 100,
        payload: 'test'
      },
      {
        aggregateId: 'ID',
        type: 'UPSERT_TEST',
        timestamp: 101,
        payload: 'test'
      }
    ])
      .readModel({
        name,
        projection,
        resolvers,
        adapter
      })
      .NON_PARAMETERIZED_RESOLVER_TEST({})

    expect(result).toMatchSnapshot()
  })

  test('Delete and non-parameterized resolver invocation', async () => {
    const result = await givenEvents([
      {
        aggregateId: 'ID',
        type: 'INSERT_TEST',
        timestamp: 100,
        payload: 'test'
      },
      {
        aggregateId: 'ID',
        type: 'DELETE_TEST',
        timestamp: 101,
        payload: 'test'
      }
    ])
      .readModel({
        name,
        projection,
        resolvers,
        adapter
      })
      .NON_PARAMETERIZED_RESOLVER_TEST({})

    expect(result).toMatchSnapshot()
  })

  test('Update and parameterized resolver invocation', async () => {
    const result = await givenEvents([
      {
        aggregateId: 'ID',
        type: 'INSERT_TEST',
        timestamp: 100,
        payload: 'test'
      },
      {
        aggregateId: 'ID',
        type: 'UPDATE_TEST',
        timestamp: 101,
        payload: 'test'
      }
    ])
      .readModel({
        name,
        projection,
        resolvers,
        adapter
      })

      .PARAMETRIZED_RESOLVER_TEST({
        firstFieldCondition: 10,
        secondFieldCondition: 2,
        pageNumber: 2,
        pageLength: 5
      })

    expect(result).toMatchSnapshot()
  })
})
