import sinon from 'sinon'

import subscribe from '../src/subscribe'

test('subscribe should works correctly', async () => {
  const pool = {
    handlers: {
      add: sinon.stub(),
      delete: sinon.stub()
    }
  }

  const handler = sinon.stub()

  const unsubscribe = await subscribe(pool, handler)

  sinon.assert.calledWith(pool.handlers.add, handler)

  await unsubscribe()

  sinon.assert.calledWith(pool.handlers.delete, handler)
})
