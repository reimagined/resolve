import createAdapter from '../src/index'

describe('createCustomAdapter', () => {
  test('should work correctly with skipInit = false', async () => {
    const EOL = `\r\n`
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
    const init = async (pool, ...args) => {
      result.push(
        'init',
        JSON.stringify(pool, null, 2),
        JSON.stringify(args, null, 2)
      )
    }
    const loadEvents = async (pool, ...args) => {
      result.push(
        'loadEvents',
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
    const dispose = async (pool, ...args) => {
      result.push(
        'dispose',
        JSON.stringify(pool, null, 2),
        JSON.stringify(args, null, 2)
      )
    }

    const createCustomAdapter = createAdapter.bind(
      null,
      connect,
      init,
      loadEvents,
      saveEvent,
      dispose,
      {}
    )

    const customAdapter = createCustomAdapter({
      skipInit: false,
      a: 'a',
      b: 'b'
    })
    await customAdapter.loadEvents({ aggregateIds: ['id1'] }, () => {})

    expect(result.join(EOL)).toMatchSnapshot('skipInit: false')
  })

  test('should work correctly with skipInit = true', async () => {
    const EOL = `\r\n`
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
    const init = async (pool, ...args) => {
      result.push(
        'init',
        JSON.stringify(pool, null, 2),
        JSON.stringify(args, null, 2)
      )
    }
    const loadEvents = async (pool, ...args) => {
      result.push(
        'loadEvents',
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
    const dispose = async (pool, ...args) => {
      result.push(
        'dispose',
        JSON.stringify(pool, null, 2),
        JSON.stringify(args, null, 2)
      )
    }

    const createCustomAdapter = createAdapter.bind(
      null,
      connect,
      init,
      loadEvents,
      saveEvent,
      dispose,
      {}
    )

    const customAdapter = createCustomAdapter({
      skipInit: true,
      a: 'a',
      b: 'b'
    })

    await customAdapter.init()

    await customAdapter.loadEvents({ aggregateIds: ['id1'] }, () => {})

    expect(result.join(EOL)).toMatchSnapshot('skipInit: true')
  })
})
