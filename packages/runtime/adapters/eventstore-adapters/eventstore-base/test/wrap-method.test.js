import sinon from 'sinon'

import wrapMethod from '../src/wrap-method'

test('wrapMethod should wrap API methods to await connection', async () => {
  const apiMethod = sinon.stub()

  const pool = {
    config: {},
    createGetConnectPromise: sinon.stub(),
    getConnectPromise: sinon.stub(),
  }

  const wrappedApiMethod = wrapMethod(pool, apiMethod)

  expect(apiMethod.callCount).toEqual(0)

  const methodArg = {}
  await wrappedApiMethod(methodArg)

  expect(apiMethod.callCount).toEqual(1)

  sinon.assert.calledWith(apiMethod, pool, methodArg)

  sinon.assert.calledWith(pool.getConnectPromise)
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
