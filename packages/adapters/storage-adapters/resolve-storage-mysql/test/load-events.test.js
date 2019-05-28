import sinon from 'sinon'

import loadEvents from '../src/load-events'

test('load events should scan eventstore within criteria', async () => {
  const events = [{ type: 'event_type_1' }, { type: 'event_type_2' }]
  const callback = sinon.stub().callsFake(async () => await Promise.resolve())

  const connection = {
    query: sinon.stub().callsFake(() => [events, []]),
    pause: sinon.stub(),
    resume: sinon.stub()
  }

  const pool = {
    connection,
    escapeId: value => `@ESCAPED[${value}]`,
    escape: value => `@@ESCAPED[${value}]`,
    tableName: 'tableName'
  }

  const filter = {
    eventTypes: ['EVENT_TYPE'],
    aggregateIds: ['AGGREGATE_ID'],
    startTime: 100,
    finishTime: 200,
    maxEventsByTimeframe: 1000
  }

  await loadEvents(pool, filter, callback)

  expect(callback.callCount).toEqual(2)
  expect(callback.firstCall.args).toEqual([events[0]])
  expect(callback.secondCall.args).toEqual([events[1]])
})
