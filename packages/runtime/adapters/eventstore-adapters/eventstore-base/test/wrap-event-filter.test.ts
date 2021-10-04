import wrapEventFilter from '../src/wrap-event-filter'
import validateEventFilter from '../src/validate-event-filter'
import type { EventFilter } from '../types'

test('wrap load events should bypass on correct filter arguments', async () => {
  const rawLoadEvents = jest.fn().mockImplementation(async () => null)
  const pool = { validateEventFilter: jest.fn() }
  const filter = {
    eventTypes: ['EVENT_TYPE'],
    aggregateIds: ['AGGREGATE_ID'],
    startTime: 100,
    finishTime: 200,
    limit: 100,
  }

  const loadEvents = wrapEventFilter(rawLoadEvents)
  await loadEvents(pool, filter)

  expect(rawLoadEvents).toHaveBeenCalledWith(pool, filter)
  expect(pool.validateEventFilter).toHaveBeenCalled()
})

test('wrap load events should fail on wrong filter argument', async () => {
  const rawLoadEvents = jest.fn().mockImplementation(async () => null)
  const pool = { validateEventFilter }
  const filter = (null as unknown) as EventFilter

  try {
    const loadEvents = wrapEventFilter(rawLoadEvents)
    await loadEvents(pool, filter)

    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
  }
})
