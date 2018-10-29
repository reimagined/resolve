import sinon from 'sinon'

import loadEvents from '../src/load-events'

test('load events should scan eventstore within criteria', async () => {
  const events = [{ type: 'event_type_1' }, { type: 'event_type_2' }]
  const callback = sinon.stub().callsFake(async () => await Promise.resolve())

  const cursor = {
    sort: sinon.stub().callsFake(() => cursor),
    projection: sinon.stub().callsFake(() => cursor),
    skip: sinon.stub().callsFake(() => cursor),
    limit: sinon.stub().callsFake(() => cursor),
    exec: sinon.stub().callsFake(async () => events)
  }
  const find = sinon.stub().callsFake(() => cursor)

  const pool = {
    disposed: false,
    promiseInvoke: async (func, ...args) => await func(...args),
    db: { find }
  }

  await loadEvents(
    pool,
    {
      eventTypes: ['EVENT_TYPE'],
      aggregateIds: ['AGGREGATE_ID'],
      startTime: 100,
      finishTime: 200
    },
    callback
  )

  expect(find.callCount).toEqual(1)
  expect(find.firstCall.args).toEqual([
    {
      type: { $in: ['EVENT_TYPE'] },
      aggregateId: { $in: ['AGGREGATE_ID'] },
      timestamp: {
        $gt: 100,
        $lt: 200
      }
    }
  ])

  expect(cursor.sort.callCount).toEqual(1)
  expect(cursor.sort.firstCall.args).toEqual([
    {
      timestamp: 1,
      aggregateVersion: 1
    }
  ])

  expect(cursor.projection.callCount).toEqual(1)
  expect(cursor.projection.firstCall.args).toEqual([
    {
      aggregateIdAndVersion: 0,
      _id: 0
    }
  ])

  expect(cursor.exec.callCount).toEqual(1)

  expect(callback.callCount).toEqual(2)
  expect(callback.firstCall.args).toEqual([events[0]])
  expect(callback.secondCall.args).toEqual([events[1]])
})
