import sinon from 'sinon'

import wrapEventFilter from '../src/wrap-event-filter'
import validateEventFilter from '../src/validate-event-filter'

test('wrap load events should bypass on correct filter arguments', async () => {
  const rawLoadEvents = sinon.stub().callsFake(async () => null)
  const callback = sinon.stub()
  const pool = { validateEventFilter: jest.fn() }
  const filter = {
    eventTypes: ['EVENT_TYPE'],
    aggregateIds: ['AGGREGATE_ID'],
    startTime: 100,
    finishTime: 200
  }

  const loadEvents = wrapEventFilter(rawLoadEvents)
  await loadEvents(pool, filter, callback)

  expect(rawLoadEvents.callCount).toEqual(1)
  expect(rawLoadEvents.firstCall.args[0]).toEqual(pool)
  expect(rawLoadEvents.firstCall.args[1]).toEqual(filter)
  expect(rawLoadEvents.firstCall.args[2]).toEqual(callback)
})

test('wrap load events should fail on wrong filter argument', async () => {
  const rawLoadEvents = sinon.stub().callsFake(async () => null)
  const callback = sinon.stub()
  const pool = { validateEventFilter }
  const filter = null

  try {
    const loadEvents = wrapEventFilter(rawLoadEvents)
    await loadEvents(pool, filter, callback)

    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)

    expect(error.message).toEqual('Event filter should be an object')
  }
})
