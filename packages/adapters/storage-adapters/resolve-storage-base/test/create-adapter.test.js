import sinon from 'sinon'

import createAdapter from '../src/create-adapter'

test('createAdapter should return the correct interface', async () => {
  const init = sinon.stub()
  const loadEvents = sinon.stub()
  const saveEvent = sinon.stub()
  const dispose = sinon.stub()

  const wrapMethod = sinon
    .stub()
    .callsFake((pool, method) => async (...args) => {
      await method(pool, ...args)
    })
  const db = {
    /* mock */
  }
  const wrapLoadEvents = sinon
    .stub()
    .callsFake(func => async (...args) => await func(...args))
  const wrapDispose = sinon
    .stub()
    .callsFake(func => async (...args) => await func(...args))

  const wrapInit = sinon.stub()
  const options = {}

  const adapter = createAdapter(
    wrapInit,
    wrapMethod,
    wrapLoadEvents,
    wrapDispose,
    init,
    loadEvents,
    saveEvent,
    dispose,
    db,
    options
  )

  await adapter.loadEventsByTypes()
  await adapter.loadEventsByAggregateIds()
  await adapter.saveEvent()
  await adapter.dispose()

  expect(loadEvents.callCount).toEqual(2)
  expect(saveEvent.callCount).toEqual(1)
  expect(dispose.callCount).toEqual(1)

  expect(wrapMethod.callCount).toEqual(4)
})
