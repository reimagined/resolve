import createAdapter from '../src'

describe('createCustomAdapter', () => {
  test('should work correctly', async () => {
    const result = []

    const connect = async (pool, ...args) => {
      pool.testField1 = 1
      pool.testField2 = 2
      result.push(
        'connect',
        JSON.stringify(pool, null, 2),
        JSON.stringify(args, null, 2)
      )
    }
    const loadEventsByTimestamp = async (pool, ...args) => {
      result.push(
        'loadEventsByTimestamp',
        JSON.stringify(pool, null, 2),
        JSON.stringify(args, null, 2)
      )
    }
    const loadEventsByCursor = async (pool, ...args) => {
      result.push(
        'loadEventsByCursor',
        JSON.stringify(pool, null, 2),
        JSON.stringify(args, null, 2)
      )
    }
    const saveEvent = async (pool, ...args) => {
      result.push(
        'saveEvent',
        JSON.stringify(pool, null, 2),
        JSON.stringify(args, null, 2)
      )
    }
    const drop = async (pool, ...args) => {
      result.push(
        'drop',
        JSON.stringify(pool, null, 2),
        JSON.stringify(args, null, 2)
      )
    }
    const dispose = async (pool, ...args) => {
      result.push(
        'dispose',
        JSON.stringify(pool, null, 2),
        JSON.stringify(args, null, 2)
      )
    }

    const createCustomAdapter = createAdapter.bind(null, {
      connect,
      loadEventsByTimestamp,
      loadEventsByCursor,
      saveEvent,
      drop,
      dispose,
    })

    const customAdapter = createCustomAdapter(
      {
        a: 'a',
        b: 'b',
      },
      () => {}
    )

    await customAdapter.loadEvents({
      aggregateIds: ['id1'],
      limit: 200,
      cursor: null,
    })
  })
})
