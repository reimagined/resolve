import sinon from 'sinon'

import wrapInit from '../src/wrap-init'

test('wrapInit should assign { initialPromise, initialPromiseResolve } to pool', async () => {
  const pool = {}
  const init = sinon.stub()
  const db = {
    /* mock */
  }

  await wrapInit(pool, init, db)

  expect(pool.initialPromise instanceof Promise).toEqual(true)
  expect(pool.initialPromiseResolve instanceof Function).toEqual(true)

  expect(init.callCount).toEqual(0)

  pool.initialPromiseResolve()
  await pool.initialPromise

  expect(init.callCount).toEqual(1)
  sinon.assert.calledWith(init, db, pool)
})
