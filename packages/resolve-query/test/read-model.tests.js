import { expect } from 'chai'
import sinon from 'sinon'

import createReadModel from '../src/read-model'

describe('resolve-query read-model', () => {
  let eventStore,
    lastProjectionError,
    readStore,
    adapter,
    projection,
    unsubscriber
  let primaryEvents, secondaryEvents, resolveSecondaryEvents

  const INIT_TIME = 1000

  const skipTicks = () =>
    new Promise(resolve =>
      Promise.resolve().then(() => process.nextTick(resolve))
    )

  beforeEach(() => {
    void ([primaryEvents, secondaryEvents] = [[], []])
    const secondaryEventsPromise = new Promise(
      resolve => (resolveSecondaryEvents = resolve)
    )
    const projectionLog = []
    unsubscriber = sinon.stub()

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

          return primaryEventPromise.then(() => unsubscriber)
        })
    }

    lastProjectionError = null
    readStore = { touch: async event => projectionLog.push(event) }

    adapter = {
      buildProjection: sinon.stub().callsFake(inputProjection =>
        Object.keys(inputProjection).reduce((acc, key) => {
          acc[key] = sinon.stub().callsFake(async event => {
            try {
              await inputProjection[key](readStore, event)
            } catch (err) {
              lastProjectionError = err
            }
          })
          return acc
        }, {})
      ),

      init: sinon.stub().callsFake(() => ({
        getLastAppliedTimestamp: sinon.stub().callsFake(async () => INIT_TIME),
        getReadable: sinon.stub().callsFake(async () => projectionLog),
        getError: sinon.stub().callsFake(async () => lastProjectionError)
      })),

      reset: sinon.stub().callsFake(async () => null)
    }

    projection = {
      GoodEvent: sinon
        .stub()
        .callsFake(async (store, event) => await store.touch(event)),
      BadEvent: sinon.stub().callsFake(async () => {
        throw new Error('BadEvent')
      }),
      FailedEvent: true
    }
  })

  afterEach(() => {
    primaryEvents = null
    secondaryEvents = null
    resolveSecondaryEvents = null
    eventStore = null
    lastProjectionError = null
    unsubscriber = null
    readStore = null
    adapter = null
    projection = null
  })

  it('should init correctly projection and adapter, and provide proper API', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter })

    expect(adapter.buildProjection.callCount).to.be.equal(1)
    expect(adapter.buildProjection.firstCall.args[0]).to.be.equal(projection)

    expect(projection.GoodEvent.callCount).to.be.equal(0)
    expect(projection.BadEvent.callCount).to.be.equal(0)

    const builtProjection = adapter.buildProjection.firstCall.returnValue
    const fakeEvent = { timestamp: 10 }

    await builtProjection.GoodEvent(fakeEvent)
    expect(projection.GoodEvent.callCount).to.be.equal(1)
    expect(projection.GoodEvent.firstCall.args[0]).to.be.equal(readStore)
    expect(projection.GoodEvent.firstCall.args[1]).to.be.equal(fakeEvent)
    expect(lastProjectionError).to.be.equal(null)

    await builtProjection.BadEvent(fakeEvent)
    expect(projection.BadEvent.callCount).to.be.equal(1)
    expect(projection.BadEvent.firstCall.args[0]).to.be.equal(readStore)
    expect(projection.BadEvent.firstCall.args[1]).to.be.equal(fakeEvent)
    expect(lastProjectionError).to.be.instanceOf(Error)
    expect(lastProjectionError.message).to.be.equal('BadEvent')

    expect(readModel.read).to.be.a('function')
    expect(readModel.dispose).to.be.a('function')
  })

  it('should provide read API witn on-demand build with success', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter })
    const builtProjection = adapter.buildProjection.firstCall.returnValue
    const appliedPromise = new Promise(resolve => {
      projection.GoodEvent.onCall(3).callsFake(async (store, event) => {
        await store.touch(event)
        resolve()
      })
    })

    primaryEvents = [
      { type: 'GoodEvent', timestamp: INIT_TIME - 10, payload: 'PRIMARY(-10)' },
      { type: 'GoodEvent', timestamp: INIT_TIME + 10, payload: 'PRIMARY(+10)' },
      { type: 'GoodEvent', timestamp: INIT_TIME + 20, payload: 'PRIMARY(+20)' }
    ]
    secondaryEvents = [
      {
        type: 'GoodEvent',
        timestamp: INIT_TIME - 10,
        payload: 'SECONDARY(-10)'
      },
      {
        type: 'GoodEvent',
        timestamp: INIT_TIME + 30,
        payload: 'SECONDARY(+30)'
      },
      {
        type: 'GoodEvent',
        timestamp: INIT_TIME + 40,
        payload: 'SECONDARY(+40)'
      }
    ]

    const firstResult = await readModel.getReadModel()

    expect(firstResult.length).to.be.equal(2)
    expect(firstResult[0]).to.be.equal(primaryEvents[1])
    expect(firstResult[1]).to.be.equal(primaryEvents[2])

    expect(builtProjection.GoodEvent.callCount).to.be.equal(2)

    resolveSecondaryEvents()
    await appliedPromise
    const secondResult = await readModel.getReadModel()

    expect(secondResult.length).to.be.equal(4)
    expect(secondResult[0]).to.be.equal(primaryEvents[1])
    expect(secondResult[1]).to.be.equal(primaryEvents[2])
    expect(secondResult[2]).to.be.equal(secondaryEvents[1])
    expect(secondResult[3]).to.be.equal(secondaryEvents[2])

    expect(builtProjection.GoodEvent.callCount).to.be.equal(4)
  })

  it('should provide read API and perform adapter init only once', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter })
    const builtProjection = adapter.buildProjection.firstCall.returnValue

    primaryEvents = [
      { type: 'GoodEvent', timestamp: INIT_TIME - 10, payload: 'PRIMARY(-10)' },
      { type: 'GoodEvent', timestamp: INIT_TIME + 10, payload: 'PRIMARY(+10)' },
      { type: 'GoodEvent', timestamp: INIT_TIME + 20, payload: 'PRIMARY(+20)' }
    ]

    expect(adapter.init.callCount).to.be.equal(0)
    const firstResult = await readModel.getReadModel()
    const secondResult = await readModel.getReadModel()

    expect(firstResult.length).to.be.equal(2)
    expect(firstResult[0]).to.be.equal(primaryEvents[1])
    expect(firstResult[1]).to.be.equal(primaryEvents[2])

    expect(secondResult.length).to.be.equal(2)
    expect(secondResult[0]).to.be.equal(primaryEvents[1])
    expect(secondResult[1]).to.be.equal(primaryEvents[2])

    expect(builtProjection.GoodEvent.callCount).to.be.equal(2)

    expect(adapter.init.callCount).to.be.equal(1)
  })

  it('should provide read API and pass special argument to readable function', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter })

    primaryEvents = [
      { type: 'GoodEvent', timestamp: INIT_TIME - 10, payload: 'PRIMARY(-10)' },
      { type: 'GoodEvent', timestamp: INIT_TIME + 10, payload: 'PRIMARY(+10)' },
      { type: 'GoodEvent', timestamp: INIT_TIME + 20, payload: 'PRIMARY(+20)' }
    ]

    const specialReadArg = {}
    await readModel.getReadModel(specialReadArg)

    const adapterApi = adapter.init.firstCall.returnValue

    expect(adapterApi.getReadable.callCount).to.be.equal(1)
    expect(adapterApi.getReadable.firstCall.args[0]).to.be.equal(specialReadArg)
  })

  it('should provide read API and handle failure on storage events', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter })
    const builtProjection = adapter.buildProjection.firstCall.returnValue

    primaryEvents = [
      { type: 'BadEvent', timestamp: INIT_TIME + 10, payload: 'PRIMARY(+10)' }
    ]

    try {
      await readModel.getReadModel()
      return Promise.reject('Projection error should hoist to read function')
    } catch (err) {
      expect(builtProjection.BadEvent.callCount).to.be.equal(1)
      const adapterApi = adapter.init.firstCall.returnValue

      expect(adapterApi.getReadable.callCount).to.be.equal(0)

      expect(adapterApi.getError.callCount).to.be.equal(1)
      expect(adapterApi.getError.firstCall.returnValue).to.be.instanceOf(
        Promise
      )

      const lastError = await adapterApi.getError.firstCall.returnValue

      expect(lastError).to.be.instanceOf(Error)
      expect(lastError.message).to.be.equal('BadEvent')
    }
  })

  it('should provide read API and handle failure on bus events', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter })
    const builtProjection = adapter.buildProjection.firstCall.returnValue
    const appliedPromise = new Promise(resolve => {
      projection.BadEvent.onCall(0).callsFake(async () => {
        skipTicks().then(resolve)
        throw new Error('BadEvent')
      })
    })

    primaryEvents = [
      { type: 'GoodEvent', timestamp: INIT_TIME + 10, payload: 'PRIMARY(+10)' }
    ]
    secondaryEvents = [
      { type: 'BadEvent', timestamp: INIT_TIME + 40, payload: 'SECONDARY(+40)' }
    ]

    await readModel.getReadModel()

    resolveSecondaryEvents()
    await appliedPromise

    try {
      await readModel.getReadModel()
      return Promise.reject('Projection error should hoist to read function')
    } catch (err) {
      expect(builtProjection.BadEvent.callCount).to.be.equal(1)

      const adapterApi = adapter.init.firstCall.returnValue

      expect(adapterApi.getReadable.callCount).to.be.equal(1)

      expect(adapterApi.getError.callCount).to.be.equal(2)

      expect(adapterApi.getError.firstCall.returnValue).to.be.instanceOf(
        Promise
      )
      expect(await adapterApi.getError.firstCall.returnValue).to.be.equal(null)

      expect(adapterApi.getError.secondCall.returnValue).to.be.instanceOf(
        Promise
      )

      const lastError = await adapterApi.getError.secondCall.returnValue

      expect(lastError).to.be.instanceOf(Error)
      expect(lastError.message).to.be.equal('BadEvent')
    }
  })

  it('should handle error in projection flow for storage events', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter })

    const builtProjection = adapter.buildProjection.firstCall.returnValue
    builtProjection.FailedEvent = sinon.stub().callsFake(async () => {
      throw new Error('Internal failure')
    })

    primaryEvents = [
      {
        type: 'FailedEvent',
        timestamp: INIT_TIME + 10,
        payload: 'PRIMARY(+10)'
      },
      { type: 'GoodEvent', timestamp: INIT_TIME + 20, payload: 'PRIMARY(+20)' }
    ]

    try {
      await readModel.getReadModel()
      return Promise.reject(
        'Projection flow failure should hoist to read function'
      )
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal('Internal failure')
    }
  })

  it('should handle error in projection flow for bus events', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter })
    const builtProjection = adapter.buildProjection.firstCall.returnValue

    const appliedPromise = new Promise(
      resolve =>
        (builtProjection.FailedEvent = sinon.stub().callsFake(async () => {
          skipTicks().then(resolve)
          throw new Error('Internal failure')
        }))
    )

    primaryEvents = [
      { type: 'GoodEvent', timestamp: INIT_TIME + 10, payload: 'PRIMARY(+10)' }
    ]

    secondaryEvents = [
      {
        type: 'FailedEvent',
        timestamp: INIT_TIME + 20,
        payload: 'PRIMARY(+20)'
      }
    ]

    await readModel.getReadModel()
    resolveSecondaryEvents()
    await appliedPromise

    try {
      await readModel.getReadModel()
      return Promise.reject(
        'Projection flow failure should hoist to read function'
      )
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal('Internal failure')
    }
  })

  it('should handle error in subscribe init phase', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter })

    adapter.init.onCall(0).callsFake(() => ({
      getLastAppliedTimestamp: sinon.stub().callsFake(async () => {
        throw new Error('Bad timestamp')
      }),
      getReadable: sinon.stub(),
      getError: sinon.stub()
    }))

    try {
      await readModel.getReadModel()
      return Promise.reject('Query should handle error in subscribe init phase')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal('Bad timestamp')
    }
  })

  it('should work fine without getLastAppliedTimestamp, with default zero value', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter })

    adapter.init.onCall(0).callsFake(() => ({
      getReadable: sinon.stub(),
      getError: sinon.stub()
    }))

    const result = await readModel.getReadModel()
    const adapterApi = adapter.init.firstCall.returnValue
    const readValue = await adapterApi.getReadable.firstCall.returnValue

    expect(result).to.be.equal(readValue)
  })

  it('should work fine with default adapter', async () => {
    primaryEvents = [
      { type: 'GoodEvent', timestamp: INIT_TIME - 10, payload: 'PRIMARY(-10)' },
      { type: 'GoodEvent', timestamp: INIT_TIME + 10, payload: 'PRIMARY(+10)' },
      { type: 'GoodEvent', timestamp: INIT_TIME + 20, payload: 'PRIMARY(+20)' }
    ]
    const appliedEvents = []

    const projection = {
      GoodEvent: (_, event) => appliedEvents.push(event)
    }

    const readModel = createReadModel({ projection, eventStore })
    await readModel.getReadModel()

    expect(appliedEvents).to.be.deep.equal(primaryEvents)
  })

  it('should work fine without projection function', async () => {
    const readModel = createReadModel({ eventStore, adapter })
    const result = await readModel.getReadModel()

    const adapterApi = adapter.init.firstCall.returnValue
    const readValue = await adapterApi.getReadable.firstCall.returnValue

    expect(result).to.be.equal(readValue)
  })

  it('should support dispose on initial phase', async () => {
    const readModel = createReadModel({ eventStore, adapter })
    readModel.dispose()

    expect(adapter.reset.callCount).to.be.equal(0)
  })

  it('should support dispose due store events loading phase', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter })

    primaryEvents = [
      { type: 'GoodEvent', timestamp: INIT_TIME - 10, payload: 'PRIMARY(-10)' },
      { type: 'GoodEvent', timestamp: INIT_TIME + 10, payload: 'PRIMARY(+10)' },
      { type: 'GoodEvent', timestamp: INIT_TIME + 20, payload: 'PRIMARY(+20)' }
    ]

    const readPromise = readModel.getReadModel()
    readModel.dispose()

    await readPromise

    expect(adapter.reset.callCount).to.be.equal(1)
    expect(unsubscriber.callCount).to.be.equal(1)
  })

  it('should support dispose after store events loading phase', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter })

    primaryEvents = [
      { type: 'GoodEvent', timestamp: INIT_TIME - 10, payload: 'PRIMARY(-10)' },
      { type: 'GoodEvent', timestamp: INIT_TIME + 10, payload: 'PRIMARY(+10)' },
      { type: 'GoodEvent', timestamp: INIT_TIME + 20, payload: 'PRIMARY(+20)' }
    ]

    await readModel.getReadModel()
    readModel.dispose()

    expect(adapter.reset.callCount).to.be.equal(1)
    expect(unsubscriber.callCount).to.be.equal(1)
  })
})
