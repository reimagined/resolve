import sinon from 'sinon'

import loadEvents from '../src/load-events'

test('load events should scan eventstore within criteria', async () => {
  const events = [{ type: 'event_type_1' }, { type: 'event_type_2' }]
  const callback = sinon.stub().callsFake(async () => await Promise.resolve())

  const stream = {
    on: sinon.stub().callsFake((type, callback) => {
      switch (type) {
        case 'result': {
          for (const event of events) {
            callback(event)
          }
          break
        }
        case 'end': {
          Promise.resolve().then(callback)
          break
        }
        default:
          break
      }
    }),
    destroy: sinon.stub()
  }

  const streamConnection = {
    query: sinon.stub().callsFake(async () => stream),
    pause: sinon.stub(),
    resume: sinon.stub()
  }

  const pool = {
    connection: { connection: streamConnection },
    escapeId: value => `@ESCAPED[${value}]`,
    escape: value => `@@ESCAPED[${value}]`,
    tableName: 'tableName'
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

  expect(streamConnection.query.callCount).toEqual(1)
  expect(streamConnection.query.firstCall.args).toMatchSnapshot()

  expect(callback.callCount).toEqual(2)
  expect(callback.firstCall.args).toEqual([events[0]])
  expect(callback.secondCall.args).toEqual([events[1]])
})
