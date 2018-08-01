import { createReadModel } from 'resolve-query'
import createMemoryReadModelAdapter from 'resolve-readmodel-memory'

import projection from '../read-models/default.projection'
import resolvers from '../read-models/default.resolvers'

describe('Read-model generic adapter API', () => {
  let buildTestReadModelReader, events

  it('Insert and non-parameterized resolver invocation', async () => {
    events.push({ type: 'INSERT_TEST', timestamp: 100, payload: 'test' })
    const reader = buildTestReadModelReader()

    const result = await reader('NON_PARAMETERIZED_RESOLVER_TEST', {})
    expect(result).toMatchSnapshot()
  })

  it('Update and non-parameterized resolver invocation', async () => {
    events.push({ type: 'INSERT_TEST', timestamp: 100, payload: 'test' })
    events.push({ type: 'UPDATE_TEST', timestamp: 101, payload: 'test' })
    const reader = buildTestReadModelReader()

    const result = await reader('NON_PARAMETERIZED_RESOLVER_TEST', {})
    expect(result).toMatchSnapshot()
  })

  it('Upsert and non-parameterized resolver invocation', async () => {
    events.push({ type: 'INSERT_TEST', timestamp: 100, payload: 'test' })
    events.push({ type: 'UPSERT_TEST', timestamp: 101, payload: 'test' })
    const reader = buildTestReadModelReader()

    const result = await reader('NON_PARAMETERIZED_RESOLVER_TEST', {})
    expect(result).toMatchSnapshot()
  })

  it('Delete and non-parameterized resolver invocation', async () => {
    events.push({ type: 'INSERT_TEST', timestamp: 100, payload: 'test' })
    events.push({ type: 'DELETE_TEST', timestamp: 101, payload: 'test' })
    const reader = buildTestReadModelReader()

    const result = await reader('NON_PARAMETERIZED_RESOLVER_TEST', {})
    expect(result).toMatchSnapshot()
  })

  it('Update and parameterized resolver invocation', async () => {
    events.push({ type: 'INSERT_TEST', timestamp: 100, payload: 'test' })
    events.push({ type: 'UPDATE_TEST', timestamp: 101, payload: 'test' })
    const reader = buildTestReadModelReader()

    const result = await reader('PARAMETRIZED_RESOLVER_TEST', {
      firstFieldCondition: 10,
      secondFieldCondition: 2,
      pageNumber: 2,
      pageLength: 5
    })
    expect(result).toMatchSnapshot()
  })

  beforeEach(async () => {
    events = []
    const eventStore = {
      async subscribeByEventType(eventTypes, handler, { startTime = 0 } = {}) {
        for (let event of events) {
          if (
            event &&
            eventTypes.indexOf(event.type) > -1 &&
            event.timestamp >= startTime
          ) {
            handler(event)
            await Promise.resolve()
          }
        }

        return () => null
      }
    }

    buildTestReadModelReader = () => {
      const readModel = createReadModel({
        adapter: createMemoryReadModelAdapter(),
        projection,
        eventStore,
        resolvers
      })

      return async (resolverName, resolverArgs) => {
        let result = await readModel.read(resolverName, resolverArgs)
        const lastError = await readModel.getLastError()

        if (lastError != null) {
          throw lastError
        }

        return result
      }
    }
  })

  afterEach(async () => {
    buildTestReadModelReader = null
    events = null
  })
})
