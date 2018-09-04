import sinon from 'sinon'

import createReadModel from '../src/read-model'

describe('resolve-query read-model', () => {
  let eventStore, readStore, adapter, projection, subscriptionCanceler
  let primaryEvents, secondaryEvents, resolveSecondaryEvents

  const INIT_TIME = 1000

  const skipTicks = () =>
    new Promise(resolve =>
      Promise.resolve().then(() => process.nextTick(resolve))
    )

  const PRIMARY = 'PRIMARY'
  const SECONDARY = 'SECONDARY'
  const FAILED = 'FAILED'
  const GOOD = 'GOOD'
  const BAD = 'BAD'

  const createEvent = (type, timestamp, order) => {
    if (
      (type !== GOOD && type !== BAD && type !== FAILED) ||
      (order !== PRIMARY && order !== SECONDARY) ||
      (timestamp == null || timestamp.constructor !== Number)
    ) {
      throw new Error(`Invalid event ${type} ${timestamp} ${order}`)
    }

    return {
      aggregateId: `test-aggregate-${Math.floor(Math.random() * 100000)}`,
      aggregateVersion: 1,
      payload: `${order}(${timestamp})`,
      timestamp: INIT_TIME + timestamp,
      type: `${type}_EVENT`
    }
  }

  beforeEach(() => {
    void ([primaryEvents, secondaryEvents] = [[], []])
    const secondaryEventsPromise = new Promise(
      resolve => (resolveSecondaryEvents = resolve)
    )
    const projectionLog = []
    subscriptionCanceler = sinon.stub()

    const processEvents = async (
      eventsList,
      eventTypes,
      callback,
      startTime
    ) => {
      for (let event of eventsList) {
        if (
          event &&
          eventTypes.indexOf(event.type) > -1 &&
          event.timestamp >= startTime
        ) {
          callback(event)
          await skipTicks()
        }
      }
    }

    eventStore = {
      subscribeByEventType: sinon
        .stub()
        .callsFake((eventTypes, callback, { startTime }) => {
          const primaryEventPromise = processEvents(
            primaryEvents,
            eventTypes,
            callback,
            startTime
          )

          primaryEventPromise
            .then(() => secondaryEventsPromise)
            .then(
              processEvents.bind(
                null,
                secondaryEvents,
                eventTypes,
                callback,
                startTime
              )
            )

          return primaryEventPromise.then(() => subscriptionCanceler)
        })
    }

    readStore = { touch: async event => projectionLog.push(event) }

    adapter = {
      buildProjection: sinon.stub().callsFake(inputProjection =>
        Object.keys(inputProjection).reduce((acc, key) => {
          acc[key] = sinon
            .stub()
            .callsFake(
              async event => await inputProjection[key](readStore, event)
            )
          return acc
        }, {})
      ),

      init: sinon.stub().callsFake(() => ({
        prepareProjection: sinon.stub().callsFake(async () => ({
          lastTimestamp: INIT_TIME,
          aggregatesVersionsMap: new Map()
        })),
        getReadInterface: sinon.stub().callsFake(async () => projectionLog)
      })),

      reset: sinon.stub().callsFake(async () => null)
    }

    projection = {
      GOOD_EVENT: sinon
        .stub()
        .callsFake(async (store, event) => await store.touch(event)),
      BAD_EVENT: sinon.stub().callsFake(async () => {
        throw new Error('BAD_EVENT')
      }),
      FAILED_EVENT: true
    }
  })

  afterEach(() => {
    primaryEvents = null
    secondaryEvents = null
    resolveSecondaryEvents = null
    eventStore = null
    subscriptionCanceler = null
    readStore = null
    adapter = null
    projection = null
  })

  it('should init correctly projection and adapter, and provide proper API', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter })

    expect(adapter.buildProjection.callCount).toEqual(1)
    expect(adapter.buildProjection.firstCall.args[0]).toEqual(projection)

    expect(projection.GOOD_EVENT.callCount).toEqual(0)
    expect(projection.BAD_EVENT.callCount).toEqual(0)

    const builtProjection = adapter.buildProjection.firstCall.returnValue
    const fakeEvent = { timestamp: 10 }

    await builtProjection.GOOD_EVENT(fakeEvent)
    expect(projection.GOOD_EVENT.callCount).toEqual(1)
    expect(projection.GOOD_EVENT.firstCall.args[0]).toEqual(readStore)
    expect(projection.GOOD_EVENT.firstCall.args[1]).toEqual(fakeEvent)

    try {
      await builtProjection.BAD_EVENT(fakeEvent)
      return Promise.reject('Event failure should be passed from projection')
    } catch (err) {
      expect(projection.BAD_EVENT.callCount).toEqual(1)
      expect(projection.BAD_EVENT.firstCall.args[0]).toEqual(readStore)
      expect(projection.BAD_EVENT.firstCall.args[1]).toEqual(fakeEvent)
    }

    expect(readModel.read).toBeInstanceOf(Function)
    expect(readModel.dispose).toBeInstanceOf(Function)
  })

  it('should provide read API with on-demand build with success', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter })
    const builtProjection = adapter.buildProjection.firstCall.returnValue
    const appliedPromise = new Promise(resolve => {
      projection.GOOD_EVENT.onCall(3).callsFake(async (store, event) => {
        await store.touch(event)
        resolve()
      })
    })

    primaryEvents = [
      createEvent(GOOD, -10, PRIMARY),
      createEvent(GOOD, 10, PRIMARY),
      createEvent(GOOD, 20, PRIMARY)
    ]
    secondaryEvents = [
      createEvent(GOOD, -10, SECONDARY),
      createEvent(GOOD, 30, SECONDARY),
      createEvent(GOOD, 40, SECONDARY)
    ]

    const firstResult = await readModel.getReadInterface()
    expect(firstResult.length).toEqual(2)
    expect(firstResult[0]).toEqual(primaryEvents[1])
    expect(firstResult[1]).toEqual(primaryEvents[2])

    expect(builtProjection.GOOD_EVENT.callCount).toEqual(2)

    resolveSecondaryEvents()
    await appliedPromise

    const secondResult = await readModel.getReadInterface()
    expect(secondResult.length).toEqual(4)
    expect(secondResult[0]).toEqual(primaryEvents[1])
    expect(secondResult[1]).toEqual(primaryEvents[2])
    expect(secondResult[2]).toEqual(secondaryEvents[1])
    expect(secondResult[3]).toEqual(secondaryEvents[2])

    expect(builtProjection.GOOD_EVENT.callCount).toEqual(4)
  })

  it('should provide read API and perform adapter init only once', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter })
    const builtProjection = adapter.buildProjection.firstCall.returnValue

    primaryEvents = [
      createEvent(GOOD, -10, PRIMARY),
      createEvent(GOOD, 10, PRIMARY),
      createEvent(GOOD, 20, PRIMARY)
    ]

    expect(adapter.init.callCount).toEqual(0)
    const firstResult = await readModel.getReadInterface()
    const secondResult = await readModel.getReadInterface()

    expect(firstResult.length).toEqual(2)
    expect(firstResult[0]).toEqual(primaryEvents[1])
    expect(firstResult[1]).toEqual(primaryEvents[2])

    expect(secondResult.length).toEqual(2)
    expect(secondResult[0]).toEqual(primaryEvents[1])
    expect(secondResult[1]).toEqual(primaryEvents[2])

    expect(builtProjection.GOOD_EVENT.callCount).toEqual(2)

    expect(adapter.init.callCount).toEqual(1)
  })

  it('should provide read API and handle failure on storage events', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter })
    const builtProjection = adapter.buildProjection.firstCall.returnValue

    primaryEvents = [createEvent(BAD, 10, PRIMARY)]

    const lastState = await readModel.getReadInterface()
    const lastError = await readModel.getLastError()

    expect(builtProjection.BAD_EVENT.callCount).toEqual(1)
    const adapterApi = adapter.init.firstCall.returnValue
    expect(adapterApi.getReadInterface.callCount).toEqual(1)

    expect(lastError).toBeInstanceOf(Error)
    expect(lastError.message).toEqual('BAD_EVENT')

    const actualState = await adapterApi.getReadInterface()
    expect(lastState).toEqual(actualState)
  })

  it('should provide read API and handle failure on bus events', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter })
    const builtProjection = adapter.buildProjection.firstCall.returnValue
    const appliedPromise = new Promise(resolve => {
      projection.BAD_EVENT.onCall(0).callsFake(async () => {
        skipTicks().then(resolve)
        throw new Error('BAD_EVENT')
      })
    })

    primaryEvents = [createEvent(GOOD, 10, PRIMARY)]
    secondaryEvents = [createEvent(BAD, 40, SECONDARY)]

    await readModel.getReadInterface()
    await readModel.getLastError()

    resolveSecondaryEvents()
    await appliedPromise

    const lastState = await readModel.getReadInterface()
    const lastError = await readModel.getLastError()

    expect(builtProjection.BAD_EVENT.callCount).toEqual(1)
    const adapterApi = adapter.init.firstCall.returnValue
    expect(adapterApi.getReadInterface.callCount).toEqual(2)

    expect(lastError).toBeInstanceOf(Error)
    expect(lastError.message).toEqual('BAD_EVENT')

    const actualState = await adapterApi.getReadInterface()
    expect(lastState).toEqual(actualState)
  })

  it('should handle error in projection flow for storage events', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter })

    const builtProjection = adapter.buildProjection.firstCall.returnValue
    builtProjection.FAILED_EVENT = sinon.stub().callsFake(async () => {
      throw new Error('Internal failure')
    })

    primaryEvents = [
      createEvent(FAILED, 10, PRIMARY),
      createEvent(GOOD, 20, PRIMARY)
    ]

    await readModel.getReadInterface()
    const lastError = await readModel.getLastError()

    expect(lastError).toBeInstanceOf(Error)
    expect(lastError.message).toEqual('Internal failure')
  })

  it('should handle error in projection flow for bus events', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter })
    const builtProjection = adapter.buildProjection.firstCall.returnValue

    const appliedPromise = new Promise(
      resolve =>
        (builtProjection.FAILED_EVENT = sinon.stub().callsFake(async () => {
          skipTicks().then(resolve)
          throw new Error('Internal failure')
        }))
    )

    primaryEvents = [createEvent(GOOD, 10, PRIMARY)]

    secondaryEvents = [createEvent(FAILED, 20, SECONDARY)]

    await readModel.getReadInterface()
    resolveSecondaryEvents()
    await appliedPromise

    const lastError = await readModel.getLastError()
    expect(lastError).toBeInstanceOf(Error)
    expect(lastError.message).toEqual('Internal failure')
  })

  it('should handle error in subscribe init phase', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter })

    adapter.init.onCall(0).callsFake(() => ({
      prepareProjection: sinon.stub().callsFake(async () => {
        throw new Error('Prepare projection error')
      }),
      getReadInterface: sinon.stub()
    }))

    await readModel.getReadInterface()
    const lastError = await readModel.getLastError()

    expect(lastError).toBeInstanceOf(Error)
    expect(lastError.message).toEqual('Prepare projection error')
  })

  it('should work fine with default zero value as initial last timestamp', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter })

    adapter.init.onCall(0).callsFake(() => ({
      getReadInterface: sinon.stub()
    }))

    const result = await readModel.getReadInterface()
    const adapterApi = adapter.init.firstCall.returnValue
    const readValue = await adapterApi.getReadInterface.firstCall.returnValue

    expect(result).toEqual(readValue)
  })

  it('should work fine without projection function', async () => {
    const readModel = createReadModel({ eventStore, adapter })
    const result = await readModel.getReadInterface()

    const adapterApi = adapter.init.firstCall.returnValue
    const readValue = await adapterApi.getReadInterface.firstCall.returnValue

    expect(result).toEqual(readValue)
  })

  it('should support dispose on initial phase', async () => {
    const readModel = createReadModel({ eventStore, adapter })
    readModel.dispose()

    expect(adapter.reset.callCount).toEqual(0)
  })

  it('should support dispose due store events loading phase', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter })

    primaryEvents = [
      createEvent(GOOD, -10, PRIMARY),
      createEvent(GOOD, 10, PRIMARY),
      createEvent(GOOD, 20, PRIMARY)
    ]

    const readPromise = readModel.getReadInterface()
    await readModel.dispose()
    await readPromise

    expect(adapter.reset.callCount).toEqual(1)
    expect(subscriptionCanceler.callCount).toEqual(1)
  })

  it('should support dispose after store events loading phase', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter })

    primaryEvents = [
      createEvent(GOOD, -10, PRIMARY),
      createEvent(GOOD, 10, PRIMARY),
      createEvent(GOOD, 20, PRIMARY)
    ]

    await readModel.getReadInterface()
    await readModel.dispose()

    expect(adapter.reset.callCount).toEqual(1)
    expect(subscriptionCanceler.callCount).toEqual(1)
  })
})
