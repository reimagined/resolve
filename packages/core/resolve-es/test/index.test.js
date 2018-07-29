/* eslint no-unused-expressions: 0 */
import sinon from 'sinon'
import uuidV4 from 'uuid/v4'
import createEventStore from '../src/index'

describe('resolve-es', () => {
  describe('subscribeByEventType', () => {
    // eslint-disable-next-line max-len
    it('should handle callback by eventTypes with events propagated from storage and bus', async () => {
      const resolvedPromise = Promise.resolve()

      const emittedEvent = { type: 'EMITTED_EVENT' }

      const storage = {
        loadEventsByTypes: sinon.stub().callsFake((eventTypes, callback) => {
          callback(emittedEvent)
          return resolvedPromise
        })
      }
      const bus = {
        subscribe: sinon.stub()
      }

      const eventStore = createEventStore({ storage, bus })

      const eventTypes = ['CREATE_TODO', 'REMOVE_TODO']
      const eventHandler = sinon.stub()
      eventStore.subscribeByEventType(eventTypes, eventHandler)

      await resolvedPromise

      expect(storage.loadEventsByTypes.calledWith(eventTypes)).toBeTruthy()
      expect(eventHandler.calledWith(emittedEvent)).toBeTruthy()
      expect(bus.subscribe.calledOnce).toBeTruthy()
    })

    // eslint-disable-next-line max-len
    it('should handle callback by eventTypes with events propagated only from bus', async () => {
      const resolvedPromise = Promise.resolve()

      const storage = { loadEventsByTypes: sinon.stub() }
      const bus = { subscribe: sinon.stub() }

      const eventStore = createEventStore({ storage, bus })

      const eventTypes = ['CREATE_TODO', 'REMOVE_TODO']
      const eventHandler = sinon.stub()
      eventStore.subscribeByEventType(eventTypes, eventHandler, {
        onlyBus: true
      })

      await resolvedPromise

      expect(storage.loadEventsByTypes.notCalled).toBeTruthy()
      expect(bus.subscribe.calledOnce).toBeTruthy()
    })

    it('using timestamp', async () => {
      const storage = { loadEventsByTypes: sinon.stub() }
      const bus = { subscribe: () => {} }
      const eventStore = createEventStore({ storage, bus })

      const eventTypes = ['CREATE_TODO', 'REMOVE_TODO']
      const eventHandler = () => {}
      const timestamp = 123

      eventStore.subscribeByEventType(eventTypes, eventHandler, {
        startTime: timestamp
      })

      sinon.assert.calledWith(
        storage.loadEventsByTypes,
        eventTypes,
        eventHandler,
        timestamp
      )
    })
  })

  describe('subscribeByAggregateId', () => {
    // eslint-disable-next-line max-len
    it('should handle callback by one AggregateId with events propagated from storage and bus', async () => {
      const resolvedPromise = Promise.resolve()

      const aggregateId = 'TEST-AGGREGATE-ID'
      const emittedEvent = { aggregateId }

      const storage = {
        loadEventsByAggregateIds: sinon
          .stub()
          .callsFake((aggregateId, callback) => {
            callback(emittedEvent)
            return resolvedPromise
          })
      }
      const bus = {
        subscribe: sinon.stub()
      }

      const eventStore = createEventStore({ storage, bus })

      const eventHandler = sinon.stub()
      eventStore.subscribeByAggregateId(aggregateId, eventHandler)

      await resolvedPromise

      expect(storage.loadEventsByAggregateIds.lastCall.args[0][0]).toEqual(
        aggregateId
      )
      expect(eventHandler.calledWith(emittedEvent)).toBeTruthy()
      expect(bus.subscribe.calledOnce).toBeTruthy()
    })

    // eslint-disable-next-line max-len
    it('should handle callback by AggregateId array with events propagated from storage and bus', async () => {
      const resolvedPromise = Promise.resolve()

      const aggregateIds = ['TEST-AGGREGATE-ID-1', 'TEST-AGGREGATE-ID-2']
      const emittedEvent = { aggregateId: aggregateIds[0] }

      const storage = {
        loadEventsByAggregateIds: sinon
          .stub()
          .callsFake((aggregateId, callback) => {
            callback(emittedEvent)
            return resolvedPromise
          })
      }
      const bus = {
        subscribe: sinon.stub()
      }

      const eventStore = createEventStore({ storage, bus })

      const eventHandler = sinon.stub()
      eventStore.subscribeByAggregateId(aggregateIds, eventHandler)

      await resolvedPromise

      expect(storage.loadEventsByAggregateIds.lastCall.args[0]).toEqual(
        aggregateIds
      )
      expect(eventHandler.calledWith(emittedEvent)).toBeTruthy()
      expect(bus.subscribe.calledOnce).toBeTruthy()
    })

    // eslint-disable-next-line max-len
    it('should handle callback by AggregateId array with events propagated only from bus', async () => {
      const resolvedPromise = Promise.resolve()

      const storage = { loadEventsByAggregateIds: sinon.stub() }
      const bus = { subscribe: sinon.stub() }

      const eventStore = createEventStore({ storage, bus })

      const eventTypes = ['CREATE_TODO', 'REMOVE_TODO']
      const eventHandler = sinon.stub()
      eventStore.subscribeByAggregateId(eventTypes, eventHandler, {
        onlyBus: true
      })

      await resolvedPromise

      expect(storage.loadEventsByAggregateIds.notCalled).toBeTruthy()
      expect(bus.subscribe.calledOnce).toBeTruthy()
    })

    it('using timestamp', async () => {
      const storage = { loadEventsByAggregateIds: sinon.stub() }
      const bus = { subscribe: () => {} }
      const eventStore = createEventStore({ storage, bus })

      const aggregateId = 'aggregateId'
      const eventHandler = () => {}
      const timestamp = 123

      eventStore.subscribeByAggregateId(aggregateId, eventHandler, {
        startTime: timestamp
      })

      sinon.assert.calledWith(
        storage.loadEventsByAggregateIds,
        [aggregateId],
        eventHandler,
        timestamp
      )
    })
  })

  describe('getEventsByAggregateId', async () => {
    // eslint-disable-next-line max-len
    it('should handle events by aggregateId with events propagated from storage', async () => {
      const resolvedPromise = Promise.resolve()

      const emittedEvent = { type: 'EMITTED_EVENT' }

      const storage = {
        loadEventsByAggregateIds: sinon
          .stub()
          .callsFake((aggregateId, callback) => {
            callback(emittedEvent)
            return resolvedPromise
          })
      }
      const bus = { subscribe: sinon.stub() }

      const eventStore = createEventStore({ storage, bus })

      const aggregateId = uuidV4()
      const handler = sinon.stub()
      eventStore.getEventsByAggregateId(aggregateId, handler)

      await resolvedPromise

      expect(storage.loadEventsByAggregateIds.lastCall.args[0][0]).toEqual(
        aggregateId
      )
      expect(handler.calledWith(emittedEvent)).toBeTruthy()
    })

    it('using timestamp', async () => {
      const storage = { loadEventsByAggregateIds: sinon.stub() }
      const bus = { subscribe: () => {} }
      const eventStore = createEventStore({ storage, bus })

      const aggregateId = 'aggregateId'
      const eventHandler = () => {}

      const timestamp = 123
      eventStore.getEventsByAggregateId(aggregateId, eventHandler, timestamp)

      sinon.assert.calledWith(
        storage.loadEventsByAggregateIds,
        [aggregateId],
        eventHandler,
        timestamp
      )
    })
  })

  describe('saveEvent', () => {
    it('should save and propagate event', async () => {
      const storage = {
        saveEvent: sinon.stub().returns(Promise.resolve())
      }
      const bus = {
        subscribe: sinon.stub(),
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
        subscribe: sinon.stub(),
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
        subscribe: sinon.stub(),
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
        subscribe: sinon.stub(),
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

  describe('saveEventRaw', () => {
    it('should save and propagate event', async () => {
      const storage = {
        saveEvent: sinon.stub().returns(Promise.resolve())
      }
      const bus = {
        subscribe: sinon.stub(),
        publish: sinon.stub().returns(Promise.resolve())
      }

      const eventStore = createEventStore({ storage, bus })
      const event = { type: 'EVENT', aggregateId: 'ID', timestamp: 100 }
      await eventStore.saveEventRaw(event)

      expect(storage.saveEvent.calledWith(event)).toBeTruthy()
      expect(bus.publish.calledWith(event)).toBeTruthy()
    })

    it('should reject events without type / aggregateId / timestamp', async () => {
      const storage = {
        saveEvent: sinon.stub().returns(Promise.resolve())
      }
      const bus = {
        subscribe: sinon.stub(),
        publish: sinon.stub().returns(Promise.resolve())
      }

      const eventStore = createEventStore({ storage, bus })
      const event = {}

      try {
        await eventStore.saveEventRaw(event)
        return Promise.reject('Test failed')
      } catch (err) {
        expect(err.message).toEqual('The `type` field is missed')
      }
    })

    it('should reject events with malformed timestamp', async () => {
      const storage = {
        saveEvent: sinon.stub().returns(Promise.resolve())
      }
      const bus = {
        subscribe: sinon.stub(),
        publish: sinon.stub().returns(Promise.resolve())
      }

      const eventStore = createEventStore({ storage, bus })
      const event = {
        type: 'Event_type',
        aggregateId: 'Id',
        timestamp: 'Wrong-timestamp'
      }

      try {
        await eventStore.saveEventRaw(event)
        return Promise.reject('Test failed')
      } catch (err) {
        expect(err.message).toEqual(
          'The `timestamp` field is missed or incorrect'
        )
      }
    })
  })

  it('onError', async () => {
    const loadEventsByTypesError = new Error('LoadEventsByTypes error')
    const loadEventsByAggregateIdError = new Error(
      'LoadEventsByAggregateId error'
    )
    const saveEventError = new Error('SaveEvent error')

    const storage = {
      loadEventsByTypes: () => {
        throw loadEventsByTypesError
      },
      loadEventsByAggregateIds: () => {
        throw loadEventsByAggregateIdError
      },
      saveEvent: () => {
        throw saveEventError
      }
    }
    const bus = {
      subscribe: sinon.stub()
    }
    const errorHandler = sinon.stub()
    const eventStore = createEventStore({ storage, bus }, errorHandler)

    await eventStore.subscribeByEventType()
    await eventStore.getEventsByAggregateId()
    await eventStore.saveEvent({
      type: 'TestEvent',
      aggregateId: 'id'
    })

    expect(errorHandler.callCount).toEqual(3)

    expect(errorHandler.firstCall.args[0]).toEqual(loadEventsByTypesError)
    expect(errorHandler.secondCall.args[0]).toEqual(
      loadEventsByAggregateIdError
    )
    expect(errorHandler.lastCall.args[0]).toEqual(saveEventError)
  })
})
