import sinon from 'sinon'

import init from '../src/init'
import ZeroMQBusError from '../src/zmq-error'

test('init should works correctly', async () => {
  let xsubSocketHandler, xpubSocketHandler, subSocketHandler

  const xsubSocket = {
    bindSync: sinon.stub(),
    send: sinon.stub(),
    on: sinon.stub().callsFake((_, handler) => (xsubSocketHandler = handler))
  }
  const xpubSocket = {
    setsockopt: sinon.stub(),
    send: sinon.stub(),
    bindSync: sinon.stub(),
    on: sinon.stub().callsFake((_, handler) => (xpubSocketHandler = handler))
  }

  const pubSocket = {
    connect: sinon.stub()
  }

  const subSocket = {
    connect: sinon.stub(),
    subscribe: sinon.stub(),
    on: sinon.stub().callsFake((_, handler) => (subSocketHandler = handler))
  }

  const zmq = {
    socket: sinon.stub().callsFake(type => {
      switch (type) {
        case 'xsub':
          return xsubSocket
        case 'xpub':
          return xpubSocket
        case 'sub':
          return subSocket
        case 'pub':
          return pubSocket
        default:
          return null
      }
    })
  }

  const pool = {
    config: {
      channel: 'channel',
      subAddress: 'subAddress',
      pubAddress: 'pubAddress'
    }
  }

  const onMessage = sinon.stub()

  await init(zmq, pool, onMessage)

  expect(pool.xsubSocket).toEqual(xsubSocket)
  expect(pool.xpubSocket).toEqual(xpubSocket)
  expect(pool.pubSocket).toEqual(pubSocket)
  expect(pool.subSocket).toEqual(subSocket)

  xpubSocketHandler('data')
  sinon.assert.calledWith(pool.xsubSocket.send, 'data')

  xsubSocketHandler('data')
  sinon.assert.calledWith(pool.xpubSocket.send, 'data')

  subSocketHandler('message')
  sinon.assert.calledWith(onMessage, 'message')
})

test('init should handle connection error', async () => {
  const error = new ZeroMQBusError('Test error', 'Test stack', 'Test cause')

  const zmq = {
    socket: sinon.stub().callsFake(() => {
      throw error
    })
  }

  const pool = {
    config: {
      channel: 'channel',
      subAddress: 'subAddress',
      pubAddress: 'pubAddress'
    }
  }

  const onMessage = sinon.stub()

  try {
    await init(zmq, pool, onMessage)

    return Promise.reject('Test failed')
  } catch (e) {
    expect(e.message).toEqual(error.message)
  }
})
