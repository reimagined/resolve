import sinon from 'sinon'

import createAdapter from '../src/create-adapter'

test('createAdapter should return the correct interface', async () => {
  const connect = sinon.stub()
  const init = sinon.stub()
  const loadEvents = sinon.stub()
  const getLatestEvent = sinon.stub()
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
  const wrapEventFilter = sinon
    .stub()
    .callsFake(func => async (...args) => await func(...args))
  const wrapDispose = sinon
    .stub()
    .callsFake((pool, func) => async (...args) => await func(...args))

  const prepare = sinon.stub()
  const options = {}

  const adapter = createAdapter(
    prepare,
    wrapMethod,
    wrapEventFilter,
    wrapDispose,
    connect,
    init,
    loadEvents,
    getLatestEvent,
    saveEvent,
    dispose,
    db,
    options
  )

  await adapter.loadEvents()
  await adapter.getLatestEvent()
  await adapter.saveEvent()
  await adapter.dispose()

  expect(loadEvents.callCount).toEqual(1)
  expect(getLatestEvent.callCount).toEqual(1)
  expect(saveEvent.callCount).toEqual(1)
  expect(dispose.callCount).toEqual(1)

  expect(wrapMethod.callCount).toEqual(4)
})
