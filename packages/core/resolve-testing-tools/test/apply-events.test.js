import sinon from 'sinon'

import applyEvents from '../src/apply-events'

test('method "applyEvents" should apply events', async () => {
  const applyEvent = sinon.stub().callsFake(async (pool, event) => event)
  const pool = { applyEvent }
  const events = [
    {
      type: 'SOME_TYPE_1',
      aggregateId: '00000000-0000-0000-0000-000000000000',
      payload: {
        test: true
      }
    },
    {
      type: 'SOME_TYPE_2',
      aggregateId: '00000000-0000-0000-0000-000000000000',
      payload: {
        test: true
      }
    }
  ]

  const result = await applyEvents(pool, events)

  expect(result).toEqual(events)
})
