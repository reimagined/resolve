import sinon from 'sinon'

import applyEvent from '../src/apply-event'

test('method "applyEvent" should apply event', async () => {
  const countEventsOnAggregate = (Math.random() * 10) | 0
  const storage = {
    loadEvents: sinon.stub().callsFake((_, callback) => {
      for (let i = 0; i < countEventsOnAggregate; i++) {
        callback()
      }
    }),
    saveEvent: sinon.stub()
  }
  const bus = {
    publish: sinon.stub()
  }
  const pool = { storage, bus, timestamp: ((Math.random() * 100) | 0) + 1 }
  const rawEvent = {
    type: 'SOME_TYPE',
    aggregateId: '00000000-0000-0000-0000-000000000000',
    payload: {
      test: true
    }
  }

  const event = await applyEvent(pool, rawEvent)

  expect(event).toMatchObject({
    ...rawEvent,
    timestamp: pool.timestamp - 1,
    aggregateVersion: 1 + countEventsOnAggregate
  })
})
