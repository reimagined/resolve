import sinon from 'sinon'

import loadEvents from '../src/load-events'

test('load events should scan eventstore within criteria', async () => {
  const criteria = 'criteria'
  const values = ['event_type_1', 'event_type_2']
  const events = [{ type: 'event_type_1' }, { type: 'event_type_2' }]
  const callback = sinon.stub().callsFake(async () => await Promise.resolve())
  const startTime = 100

  const pool = {
    connection: {
      execute: sinon.stub().callsFake(async () => [events]),
      end: sinon.stub().callsFake(async () => null)
    },
    escapeId: value => `@ESCAPED[${value}]`,
    tableName: 'tableName'
  }

  await loadEvents(pool, criteria, values, callback, startTime)

  expect(pool.connection.execute.callCount).toEqual(1)
  expect(pool.connection.execute.firstCall.args).toMatchSnapshot()

  expect(callback.callCount).toEqual(2)
  expect(callback.firstCall.args).toEqual([events[0]])
  expect(callback.secondCall.args).toEqual([events[1]])
})
