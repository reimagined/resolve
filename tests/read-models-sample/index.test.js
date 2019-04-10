import givenEvents from 'resolve-testing-tools'
import createReadModelAdapter from 'resolve-readmodel-lite'

import projection from './projection'
import resolvers from './resolvers'

describe('Read-model generic adapter API', () => {
  let adapter = null
  beforeEach(() => {
    adapter = createReadModelAdapter({
      databaseFile: ':memory:'
    })
  })
  afterEach(() => {
    adapter = null
  })

  it('Insert and non-parameterized resolver invocation', async () => {
    const result = await givenEvents([
      {
        aggregateId: 'ID',
        type: 'INSERT_TEST',
        timestamp: 100,
        payload: 'test'
      }
    ])
      .readModel({
        name: 'ReadModelName',
        projection,
        resolvers,
        adapter
      })
      .NON_PARAMETERIZED_RESOLVER_TEST({})

    expect(result).toMatchSnapshot()
  })

  it('Update and non-parameterized resolver invocation', async () => {
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
        name: 'ReadModelName',
        projection,
        resolvers,
        adapter
      })
      .NON_PARAMETERIZED_RESOLVER_TEST({})

    expect(result).toMatchSnapshot()
  })

  it('Upsert and non-parameterized resolver invocation', async () => {
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
        name: 'ReadModelName',
        projection,
        resolvers,
        adapter
      })
      .NON_PARAMETERIZED_RESOLVER_TEST({})

    expect(result).toMatchSnapshot()
  })

  it('Delete and non-parameterized resolver invocation', async () => {
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
        name: 'ReadModelName',
        projection,
        resolvers,
        adapter
      })
      .NON_PARAMETERIZED_RESOLVER_TEST({})

    expect(result).toMatchSnapshot()
  })

  it('Update and parameterized resolver invocation', async () => {
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
        name: 'ReadModelName',
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
