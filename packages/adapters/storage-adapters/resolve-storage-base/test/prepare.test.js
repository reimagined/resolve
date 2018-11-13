import sinon from 'sinon'

import prepare from '../src/prepare'

test('prepare should assign { initialPromise, initialPromiseResolve } to pool', async () => {
  const pool = {}
  const connect = sinon.stub()
  const init = sinon.stub()
  const adapterSpecificArguments = {
    /* mock */
    arg1: () => {},
    arg2: () => {}
  }

  await prepare(pool, connect, init, adapterSpecificArguments)

  expect(pool.connectPromise instanceof Promise).toEqual(true)
  expect(pool.connectPromiseResolve instanceof Function).toEqual(true)
  expect(pool.initialPromise instanceof Promise).toEqual(true)
  expect(pool.initialPromiseResolve instanceof Function).toEqual(true)

  expect(connect.callCount).toEqual(0)

  pool.connectPromiseResolve()
  await pool.connectPromise

  expect(connect.callCount).toEqual(1)
  sinon.assert.calledWith(connect, pool, adapterSpecificArguments)

  expect(init.callCount).toEqual(0)

  pool.initialPromiseResolve()
  await pool.initialPromise

  expect(init.callCount).toEqual(1)
  sinon.assert.calledWith(init, pool)
})
