import sinon from 'sinon'

import applyEvents from '../src/apply-events'

test('method "applyEvents" should apply events', async () => {
  // const storage = sinon.stub().callsFake(async (pool, event) => event)
  const eventsInStorage = [
    {
      aggregateId: 'id1',
      aggregateVersion: 1,
      type: 'SOME_TYPE_1',
      payload: {
        test: true
      }
    },
    {
      aggregateId: 'id1',
      aggregateVersion: 2,
      type: 'SOME_TYPE_2',
      payload: {
        test: true
      }
    },
    {
      aggregateId: 'id2',
      aggregateVersion: 1,
      type: 'SOME_TYPE_1',
      payload: {
        test: true
      }
    }
  ]
  const newEvents = [
    {
      aggregateId: 'id1',
      aggregateVersion: 3,
      type: 'SOME_TYPE_1',
      payload: {
        test: true
      }
    },
    {
      aggregateId: 'id1',
      aggregateVersion: 4,
      type: 'SOME_TYPE_2',
      payload: {
        test: true
      }
    },
    {
      aggregateId: 'id2',
      aggregateVersion: 2,
      type: 'SOME_TYPE_1',
      payload: {
        test: true
      }
    }
  ]
  const storage = {
    loadEvents: sinon.stub().callsFake((filter, callback) => {
      // console.log(events.length)
      for (const event of eventsInStorage) {
        if (filter.aggregateIds.includes(event.aggregateId)) {
          callback(event)
        }
      }
    }),
    saveEvent: sinon.stub()
  }
  const bus = {
    publish: sinon.stub()
  }

  const pool = { timestamp: 1, storage, bus }

  const result = await applyEvents(pool, newEvents)

  expect(result).toMatchObject(newEvents)
})
