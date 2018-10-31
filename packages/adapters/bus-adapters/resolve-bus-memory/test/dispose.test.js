import sinon from 'sinon'
import dispose from '../src/dispose'

test('dispose should call method clear of handlers', async () => {
  const pool = {
    disposed: false,
    handlers: {
      clear: sinon.stub()
    }
  }

  await dispose(pool)

  expect(pool.disposed).toEqual(true)
  expect(pool.handlers.clear.callCount).toEqual(1)
})
