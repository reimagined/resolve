import sinon from 'sinon'

import ZeroMQBusError from '../src/zmq-error'
import dispose from '../src/dispose'

test('dispose should close the connection [success, broker mode]', async () => {
  const pool = {
    disposed: false,
    handlers: {
      clear: sinon.stub()
    },
    config: {
      subAddress: 'subAddress',
      pubAddress: 'pubAddress'
    },
    xpubSocket: {
      unbindSync: sinon.stub()
    },
    xsubSocket: {
      unbindSync: sinon.stub()
    },
    pubSocket: {
      disconnect: sinon.stub()
    },
    subSocket: {
      disconnect: sinon.stub()
    }
  }

  await dispose(pool)

  expect(pool.disposed).toEqual(true)
  expect(pool.handlers.clear.callCount).toEqual(1)

  sinon.assert.calledWith(pool.xpubSocket.unbindSync, pool.config.pubAddress)

  sinon.assert.calledWith(pool.xsubSocket.unbindSync, pool.config.subAddress)

  sinon.assert.calledWith(pool.pubSocket.disconnect, pool.config.subAddress)

  sinon.assert.calledWith(pool.subSocket.disconnect, pool.config.pubAddress)
})

test('dispose should close the connection [success, client mode]', async () => {
  const pool = {
    disposed: false,
    handlers: {
      clear: sinon.stub()
    },
    config: {
      subAddress: 'subAddress',
      pubAddress: 'pubAddress'
    },
    pubSocket: {
      disconnect: sinon.stub()
    },
    subSocket: {
      disconnect: sinon.stub()
    }
  }

  await dispose(pool)

  expect(pool.disposed).toEqual(true)
  expect(pool.handlers.clear.callCount).toEqual(1)

  sinon.assert.calledWith(pool.pubSocket.disconnect, pool.config.subAddress)

  sinon.assert.calledWith(pool.subSocket.disconnect, pool.config.pubAddress)
})

test('dispose should close the connection [failure]', async () => {
  const error = new ZeroMQBusError('Test error', 'Test stack')

  const pool = {
    disposed: false,
    handlers: {
      clear: sinon.stub()
    },
    config: {
      subAddress: 'subAddress',
      pubAddress: 'pubAddress'
    },
    pubSocket: {
      disconnect: sinon.stub().callsFake(() => {
        throw error
      })
    },
    subSocket: {
      disconnect: sinon.stub()
    }
  }

  try {
    await dispose(pool)
    return Promise.reject('Test failed')
  } catch (e) {
    expect(e).toEqual(error)
  }

  expect(pool.disposed).toEqual(true)
  expect(pool.handlers.clear.callCount).toEqual(1)
})
