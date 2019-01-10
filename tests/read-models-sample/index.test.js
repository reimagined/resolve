import { createReadModel } from 'resolve-testing-tools'

import projection from './projection'
import resolvers from './resolvers'

describe('Read-model generic adapter API', () => {
  it('Insert and non-parameterized resolver invocation', async () => {
    const events = [
      {
        aggregateId: 'ID',
        type: 'INSERT_TEST',
        timestamp: 100,
        payload: 'test'
      }
    ]

    const readModel = createReadModel({
      name: 'something',
      projection,
      resolvers
    })

    await readModel.applyEvents(events)

    const result = await readModel.resolvers.NON_PARAMETERIZED_RESOLVER_TEST({})
    expect(result).toMatchSnapshot()
  })

  it('Update and non-parameterized resolver invocation', async () => {
    const events = [
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
    ]

    const readModel = createReadModel({
      name: 'something',
      projection,
      resolvers
    })

    await readModel.applyEvents(events)

    const result = await readModel.resolvers.NON_PARAMETERIZED_RESOLVER_TEST({})
    expect(result).toMatchSnapshot()
  })

  it('Upsert and non-parameterized resolver invocation', async () => {
    const events = [
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
    ]

    const readModel = createReadModel({
      name: 'something',
      projection,
      resolvers
    })

    await readModel.applyEvents(events)

    const result = await readModel.resolvers.NON_PARAMETERIZED_RESOLVER_TEST({})
    expect(result).toMatchSnapshot()
  })

  it('Delete and non-parameterized resolver invocation', async () => {
    const events = [
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
    ]
    const readModel = createReadModel({
      name: 'something',
      projection,
      resolvers
    })

    await readModel.applyEvents(events)

    const result = await readModel.resolvers.NON_PARAMETERIZED_RESOLVER_TEST({})
    expect(result).toMatchSnapshot()
  })

  it('Update and parameterized resolver invocation', async () => {
    const events = [
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
    ]
    const readModel = createReadModel({
      name: 'something',
      projection,
      resolvers
    })

    await readModel.applyEvents(events)

    const result = await readModel.resolvers.PARAMETRIZED_RESOLVER_TEST({
      firstFieldCondition: 10,
      secondFieldCondition: 2,
      pageNumber: 2,
      pageLength: 5
    })
    expect(result).toMatchSnapshot()
  })
})
