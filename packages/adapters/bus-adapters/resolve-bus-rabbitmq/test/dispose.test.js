import sinon from 'sinon'

import RabbitMQError from '../src/rabbitmq-error'
import dispose from '../src/dispose'

test('dispose should close the connection [success]', async () => {
  const pool = {
    disposed: false,
    handlers: {
      clear: sinon.stub()
    },
    connection: {
      close: sinon.stub().callsFake(callback => callback())
    }
  }

  await dispose(pool)

  expect(pool.disposed).toEqual(true)
  expect(pool.handlers.clear.callCount).toEqual(1)
  expect(pool.connection.close.callCount).toEqual(1)
})

test('dispose should close the connection [failure]', async () => {
  const error = new RabbitMQError('Test error', 'Test stack')

  const pool = {
    disposed: false,
    handlers: {
      clear: sinon.stub()
    },
    connection: {
      close: sinon.stub().callsFake(callback => callback(error))
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
  expect(pool.connection.close.callCount).toEqual(1)
})
