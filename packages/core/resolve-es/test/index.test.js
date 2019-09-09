/* eslint no-unused-expressions: 0 */
import sinon from 'sinon'
import createEventStore from '../src/index'
import { Readable } from 'stream'

describe('resolve-es', () => {
  describe('loadEvents', () => {
    it('should perform events loading and transmitting from storage', async () => {
      const handler = sinon.stub().callsFake(async () => {})
      const event = { type: 'EVENT_TYPE' }
      const storage = {
        loadEvents: sinon.stub().callsFake(async (_, callback) => {
          await callback(event)
        })
      }

      const eventStore = createEventStore({ storage })
      const eventTypes = ['EVENT_TYPE']
      const aggregateIds = ['AGGREGATE_ID']
      const startTime = 100
      const finishTime = 200
      const filter = {
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

      expect(handler.callCount).toEqual(1)
      expect(handler.firstCall.args[0]).toEqual(event)
    })

    it('should return export stream', async () => {
      const stream = new Readable()
      const storage = {
        export: jest.fn().mockReturnValue(stream)
      }

      const eventStore = createEventStore({ storage })

      const result = eventStore.export()

      expect(storage.export).toHaveBeenCalled()
      expect(result).toEqual(stream)
    })

    it('should return import stream', async () => {
      const stream = new Readable()
      const storage = {
        import: jest.fn().mockReturnValue(stream)
      }

      const eventStore = createEventStore({ storage })

      const result = eventStore.import()

      expect(storage.import).toHaveBeenCalled()
      expect(result).toEqual(stream)
    })

    it('should perform events loading and transmitting from storage only', async () => {
      const handler = sinon.stub().callsFake(async () => {})
      const event = { type: 'EVENT_TYPE' }
      const storage = {
        loadEvents: sinon.stub().callsFake(async (_, callback) => {
          await callback(event)
        })
      }

      const eventStore = createEventStore({ storage })
      const eventTypes = ['EVENT_TYPE']
      const aggregateIds = ['AGGREGATE_ID']
      const startTime = 100
      const finishTime = 200
      const filter = {
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

      expect(handler.callCount).toEqual(1)
      expect(handler.firstCall.args[0]).toEqual(event)
    })
  })

  describe('saveEvent', () => {
    it('should save and propagate event', async () => {
      const storage = {
        saveEvent: sinon.stub().returns(Promise.resolve())
      }

      const eventStore = createEventStore({ storage })
      const event = {
        type: 'EVENT',
        aggregateId: 'ID',
        aggregateVersion: 1,
        timestamp: 1
      }
      await eventStore.saveEvent(event)

      expect(storage.saveEvent.calledWith(event)).toBeTruthy()
    })

    it('should reject events without type', async () => {
      const storage = {
        saveEvent: sinon.stub().returns(Promise.resolve())
      }

      const eventStore = createEventStore({ storage })
      const event = { aggregateId: 'ID' }

      try {
        await eventStore.saveEvent(event)
        return Promise.reject('Test failed')
      } catch (err) {
        expect(err.message).toEqual('The `type` field is invalid')
      }
    })

    it('should reject events without aggregateId', async () => {
      const storage = {
        saveEvent: sinon.stub().returns(Promise.resolve())
      }

      const eventStore = createEventStore({ storage })
      const event = { type: 'EVENT_TYPE', timestamp: 1 }

      try {
        await eventStore.saveEvent(event)
        return Promise.reject('Test failed')
      } catch (err) {
        expect(err.message).toEqual('The `aggregateId` field is invalid')
      }
    })

    it('should reject events without aggregateVersion', async () => {
      const storage = {
        saveEvent: sinon.stub().returns(Promise.resolve())
      }

      const eventStore = createEventStore({ storage })
      const event = { type: 'EVENT_TYPE', aggregateId: 'ID', timestamp: 1 }

      try {
        await eventStore.saveEvent(event)
        return Promise.reject('Test failed')
      } catch (err) {
        expect(err.message).toEqual('The `aggregateVersion` field is invalid')
      }
    })

    it('should reject events without timestamp', async () => {
      const storage = {
        saveEvent: sinon.stub().returns(Promise.resolve())
      }

      const eventStore = createEventStore({ storage })
      const event = {
        type: 'EVENT_TYPE',
        aggregateId: 'ID',
        aggregateVersion: 1
      }

      try {
        await eventStore.saveEvent(event)
        return Promise.reject('Test failed')
      } catch (err) {
        expect(err.message).toEqual('The `timestamp` field is invalid')
      }
    })
  })

  it('should handle on error', async () => {
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
    const eventStore = createEventStore({ storage }, errorHandler)

    await eventStore.loadEvents({
      startTime: 100,
      finishTime: 200,
      eventTypes: ['EVENT_TYPE'],
      aggregateIds: ['AGGREGATE_ID']
    })

    expect(errorHandler.callCount).toEqual(1)

    await eventStore.saveEvent({
      type: 'TestEvent',
      aggregateId: 'id',
      aggregateVersion: 1,
      timestamp: 1
    })

    expect(errorHandler.callCount).toEqual(2)

    expect(errorHandler.firstCall.args[0]).toEqual(loadEventsError)

    expect(errorHandler.secondCall.args[0]).toEqual(saveEventError)
  })
})
