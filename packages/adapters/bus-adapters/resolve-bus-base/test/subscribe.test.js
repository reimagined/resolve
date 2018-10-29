import sinon from 'sinon'

import subscribe from '../src/subscribe'

test('subscribe should works correctly', async () => {
  const pool = { handlers: new Map() }
  const handler = sinon.stub()

  const unsubscribe = await subscribe(
    pool,
    {
      eventTypes: ['EVENT_TYPE_1', 'EVENT_TYPE_2'],
      aggregateIds: ['AGGREGATE_ID_1', 'AGGREGATE_ID_2']
    },
    handler
  )

  expect(Array.from(pool.handlers.keys())).toEqual([
    'EVENT_TYPE_1/AGGREGATE_ID_1',
    'EVENT_TYPE_1/AGGREGATE_ID_2',
    'EVENT_TYPE_2/AGGREGATE_ID_1',
    'EVENT_TYPE_2/AGGREGATE_ID_2'
  ])

  await unsubscribe()

  expect(Array.from(pool.handlers.keys())).toEqual([])
})
