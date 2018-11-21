/* eslint no-unused-expressions: 0 */
import sinon from 'sinon'
import createEventStore from '../src/index'

describe('resolve-es', () => {
  describe('loadEvents', () => {
    it('should perform events loading and transmitting from storage and bus', async () => {
      const handler = sinon.stub().callsFake(async () => {})
      const event = { type: 'EVENT_TYPE' }
      const storage = {
        loadEvents: sinon.stub().callsFake(async (_, callback) => {
          await callback(event)
        })
      }
      const bus = {
        subscribe: sinon.stub().callsFake(async (_, callback) => {
          await callback(event)
        })
      }

      const eventStore = createEventStore({ storage, bus })
      const eventTypes = ['EVENT_TYPE']
      const aggregateIds = ['AGGREGATE_ID']
      const startTime = 100
      const finishTime = 200
      const filter = {
        skipStorage: false,
        skipBus: false,
        startTime,
        finishTime,
        eventTypes,
        aggregateIds
      }

      await eventStore.loadEvents(filter, handler)

      expect(storage.loadEvents.callCount).toEqual(1)
      expect(storage.loadEvents.firstCall.args[0]).toEqual({
        startTime,
        finishTime,
        eventTypes,
        aggregateIds
      })
      expect(storage.loadEvents.firstCall.args[1]).toEqual(handler)

      expect(bus.subscribe.callCount).toEqual(1)
      expect(bus.subscribe.firstCall.args[0]).toEqual({
        eventTypes,
        aggregateIds
      })
      expect(bus.subscribe.firstCall.args[1]).toEqual(handler)

      expect(handler.callCount).toEqual(2)
      expect(handler.firstCall.args[0]).toEqual(event)
      expect(handler.secondCall.args[0]).toEqual(event)
    })

    it('should perform events loading and transmitting from storage only', async () => {
      const handler = sinon.stub().callsFake(async () => {})
      const event = { type: 'EVENT_TYPE' }
      const storage = {
        loadEvents: sinon.stub().callsFake(async (_, callback) => {
          await callback(event)
        })
      }
      const bus = {
        subscribe: sinon.stub().callsFake(async (_, callback) => {
          await callback(event)
        })
      }

      const eventStore = createEventStore({ storage, bus })
      const eventTypes = ['EVENT_TYPE']
      const aggregateIds = ['AGGREGATE_ID']
      const startTime = 100
      const finishTime = 200
      const filter = {
        skipStorage: false,
        skipBus: true,
        startTime,
        finishTime,
        eventTypes,
        aggregateIds
      }

      await eventStore.loadEvents(filter, handler)

      expect(storage.loadEvents.callCount).toEqual(1)
      expect(storage.loadEvents.firstCall.args[0]).toEqual({
        startTime,
        finishTime,
        eventTypes,
        aggregateIds
      })
      expect(storage.loadEvents.firstCall.args[1]).toEqual(handler)

      expect(bus.subscribe.callCount).toEqual(0)

      expect(handler.callCount).toEqual(1)
      expect(handler.firstCall.args[0]).toEqual(event)
    })

    it('should perform events loading and transmitting from bus only', async () => {
      const handler = sinon.stub().callsFake(async () => {})
      const event = { type: 'EVENT_TYPE' }
      const storage = {
        loadEvents: sinon.stub().callsFake(async (_, callback) => {
          await callback(event)
        })
      }
      const bus = {
        subscribe: sinon.stub().callsFake(async (_, callback) => {
          await callback(event)
        })
      }

      const eventStore = createEventStore({ storage, bus })
      const eventTypes = ['EVENT_TYPE']
      const aggregateIds = ['AGGREGATE_ID']
      const startTime = 100
      const finishTime = 200
      const filter = {
        skipStorage: true,
        skipBus: false,
        startTime,
        finishTime,
        eventTypes,
        aggregateIds
      }

      await eventStore.loadEvents(filter, handler)

      expect(storage.loadEvents.callCount).toEqual(0)

      expect(bus.subscribe.callCount).toEqual(1)
      expect(bus.subscribe.firstCall.args[0]).toEqual({
        eventTypes,
        aggregateIds
      })
      expect(bus.subscribe.firstCall.args[1]).toEqual(handler)

      expect(handler.callCount).toEqual(1)
      expect(handler.firstCall.args[0]).toEqual(event)
    })
  })

  describe('saveEvent', () => {
    it('should save and propagate event', async () => {
      const storage = {
        saveEvent: sinon.stub().returns(Promise.resolve())
      }
      const bus = {
        subscribe: sinon.stub().returns(Promise.resolve()),
        publish: sinon.stub().returns(Promise.resolve())
      }

      const eventStore = createEventStore({ storage, bus })
      const event = { type: 'EVENT', aggregateId: 'ID' }
      await eventStore.saveEvent(event)

      expect(storage.saveEvent.calledWith(event)).toBeTruthy()
      expect(bus.publish.calledWith(event)).toBeTruthy()
    })

    it('should reject events without type', async () => {
      const storage = {
        saveEvent: sinon.stub().returns(Promise.resolve())
      }
      const bus = {
        subscribe: sinon.stub().returns(Promise.resolve()),
        publish: sinon.stub().returns(Promise.resolve())
      }

      const eventStore = createEventStore({ storage, bus })
      const event = { aggregateId: 'ID' }

      try {
        await eventStore.saveEvent(event)
        return Promise.reject('Test failed')
      } catch (err) {
        expect(err.message).toEqual('The `type` field is missed')
      }
    })

    it('should reject events without aggregateId', async () => {
      const storage = {
        saveEvent: sinon.stub().returns(Promise.resolve())
      }
      const bus = {
        subscribe: sinon.stub().returns(Promise.resolve()),
        publish: sinon.stub().returns(Promise.resolve())
      }

      const eventStore = createEventStore({ storage, bus })
      const event = { type: 'EVENT_TYPE' }

      try {
        await eventStore.saveEvent(event)
        return Promise.reject('Test failed')
      } catch (err) {
        expect(err.message).toEqual('The `aggregateId` field is missed')
      }
    })

    it('should enforce timestamp field in event with actual time', async () => {
      const storage = {
        saveEvent: sinon.stub().returns(Promise.resolve())
      }
      const bus = {
        subscribe: sinon.stub().returns(Promise.resolve()),
        publish: sinon.stub().returns(Promise.resolve())
      }

      const eventStore = createEventStore({ storage, bus })
      const event = { type: 'EVENT_TYPE', aggregateId: 'ID' }

      const originalDateNow = Date.now
      Date.now = () => Number.MAX_VALUE

      const savingPromise = eventStore.saveEvent(event)

      Date.now = originalDateNow
      await savingPromise

      expect(event.timestamp).toEqual(Number.MAX_VALUE)
    })
  })

  it('onError', async () => {
    const loadEventsError = new Error('LoadEvents error')
    const saveEventError = new Error('SaveEvent error')

    const storage = {
      loadEvents: () => {
        throw loadEventsError
      },
      saveEvent: () => {
        throw saveEventError
      }
    }

    const errorHandler = sinon.stub()
    const eventStore = createEventStore({ storage, bus: null }, errorHandler)

    await eventStore.loadEvents({
      skipStorage: false,
      skipBus: true,
      startTime: 100,
      finishTime: 200,
      eventTypes: ['EVENT_TYPE'],
      aggregateIds: ['AGGREGATE_ID']
    })
    await eventStore.saveEvent({
      type: 'TestEvent',
      aggregateId: 'id'
    })

    expect(errorHandler.callCount).toEqual(2)

    expect(errorHandler.firstCall.args[0]).toEqual(loadEventsError)

    expect(errorHandler.secondCall.args[0]).toEqual(saveEventError)
  })
})
