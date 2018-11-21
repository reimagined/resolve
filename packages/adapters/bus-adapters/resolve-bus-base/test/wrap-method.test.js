import sinon from 'sinon'

import wrapMethod from '../src/wrap-method'

test('wrapMethod should wrap API methods to await initialization', async () => {
  const apiMethod = sinon.stub()

  const pool = {
    initialPromiseResolve: sinon.stub(),
    initialPromise: Promise.resolve()
  }

  const wrappedApiMethod = wrapMethod(pool, apiMethod)

  expect(apiMethod.callCount).toEqual(0)

  const methodArg = {}
  await wrappedApiMethod(methodArg)

  expect(apiMethod.callCount).toEqual(1)

  sinon.assert.calledWith(apiMethod, pool, methodArg)

  sinon.assert.calledWith(pool.initialPromiseResolve)
})

test('wrapMethod handle dispose adapter state', async () => {
  const apiMethod = sinon.stub()

  const pool = { disposed: true }

  const wrappedApiMethod = wrapMethod(pool, apiMethod)
  expect(apiMethod.callCount).toEqual(0)

  try {
    await wrappedApiMethod()
  } catch (e) {
    expect(e.message).toEqual('Adapter has been already disposed')
  }
})
