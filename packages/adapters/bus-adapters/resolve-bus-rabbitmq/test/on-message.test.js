import sinon from 'sinon'

import onMessage from '../src/on-message'

const TOPIC_NAME = 'TOPIC_NAME'

test('onMessage should call all the handlers with good handlers', async () => {
  const handler1 = sinon.stub()
  const handler2 = sinon.stub()
  const handler3 = sinon.stub()

  const event = { type: 'EVENT_TYPE' }

  const pool = {
    makeTopicsForEvent: () => [TOPIC_NAME],
    handlers: new Map([[TOPIC_NAME, new Set([handler1, handler2, handler3])]])
  }

  const message = {
    content: new Buffer(JSON.stringify(event))
  }

  await onMessage(pool, message)

  sinon.assert.calledWith(handler1, event)
  sinon.assert.calledWith(handler2, event)
  sinon.assert.calledWith(handler3, event)
})

test('onMessage should call all the handlers with failed handler', async () => {
  const error = new Error('Test error')
  const handler1 = sinon.stub()
  const handler2 = sinon.stub().callsFake(async () => {
    throw error
  })
  const handler3 = sinon.stub()

  const event = { type: 'EVENT_TYPE' }

  const pool = {
    makeTopicsForEvent: () => [TOPIC_NAME],
    handlers: new Map([[TOPIC_NAME, new Set([handler1, handler2, handler3])]])
  }

  const message = {
    content: new Buffer(JSON.stringify(event))
  }

  await onMessage(pool, message)

  sinon.assert.calledWith(handler1, event)
  sinon.assert.calledWith(handler2, event)
  sinon.assert.calledWith(handler3, event)

  expect(await handler2.firstCall.returnValue.catch(e => e)).toEqual(error)
})

test('onMessage should noop on malformed message', async () => {
  const handler = sinon.stub()

  const pool = {
    makeTopicsForEvent: () => [TOPIC_NAME],
    handlers: new Map([[TOPIC_NAME, new Set([handler])]])
  }

  const message = {
    content: null
  }

  await onMessage(pool, message)

  expect(handler.callCount).toEqual(0)
})
