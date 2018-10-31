import sinon from 'sinon'

import onMessage from '../src/on-message'

const TOPIC_NAME = 'TOPIC_NAME'

test('onMessage should call all the handlers with good handlers', async () => {
  const handler1 = sinon.stub()
  const handler2 = sinon.stub()
  const handler3 = sinon.stub()

  const pool = {
    config: { channel: 'channel' },
    makeTopicsForEvent: () => [TOPIC_NAME],
    handlers: new Map([[TOPIC_NAME, new Set([handler1, handler2, handler3])]])
  }

  const message = 'channel { "content": 111 }'

  await onMessage(pool, message)

  sinon.assert.calledWith(handler1, { content: 111 })
  sinon.assert.calledWith(handler2, { content: 111 })
  sinon.assert.calledWith(handler3, { content: 111 })
})

test('onMessage should call all the handlers with failed handler', async () => {
  const error = new Error('Test error')
  const handler1 = sinon.stub()
  const handler2 = sinon.stub().callsFake(async () => {
    throw error
  })
  const handler3 = sinon.stub()

  const pool = {
    config: { channel: 'channel' },
    makeTopicsForEvent: () => [TOPIC_NAME],
    handlers: new Map([[TOPIC_NAME, new Set([handler1, handler2, handler3])]])
  }

  const message = 'channel { "content": 111 }'

  await onMessage(pool, message)

  sinon.assert.calledWith(handler1, { content: 111 })
  sinon.assert.calledWith(handler2, { content: 111 })
  sinon.assert.calledWith(handler3, { content: 111 })
})
