import sinon from 'sinon'

import createAdapter from '../src/create-adapter'

test('createAdapter should return the correct interface', async () => {
  const init = sinon.stub()
  const publish = sinon.stub()
  const subscribe = sinon.stub()
  const dispose = sinon.stub()
  const onMessage = sinon.stub()
  const wrapMethod = sinon
    .stub()
    .callsFake((pool, method) => async (...args) => {
      await method(pool, ...args)
    })
  const amqp = {
    /* mock */
  }
  const wrapInit = sinon.stub()
  const options = {}

  const adapter = createAdapter(
    wrapInit,
    wrapMethod,
    subscribe,
    onMessage,
    init,
    publish,
    dispose,
    amqp,
    options
  )

  await adapter.publish()
  await adapter.subscribe()
  await adapter.dispose()

  expect(publish.callCount).toEqual(1)
  expect(subscribe.callCount).toEqual(1)
  expect(dispose.callCount).toEqual(1)

  expect(wrapMethod.callCount).toEqual(3)
})
