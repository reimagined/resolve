import sinon from 'sinon'
import publish from '../src/publish'

const TOPIC_NAME = 'TOPIC_NAME'

test('publish should work correctly', async () => {
  const handlers = [sinon.stub(), sinon.stub(), sinon.stub()]

  const pool = {
    makeTopicsForEvent: () => [TOPIC_NAME],
    handlers: new Map([[TOPIC_NAME, new Set(handlers)]]),
    config: {
      channel: 'channel'
    }
  }

  const event = { event: 'content' }

  await publish(pool, event)

  sinon.assert.calledWith(handlers[0], event)
  sinon.assert.calledWith(handlers[1], event)
  sinon.assert.calledWith(handlers[2], event)
})

test('publish causes exception', async () => {
  const handlers = [sinon.stub(), sinon.stub(), sinon.stub()]

  const pool = {
    disposed: true,
    makeTopicsForEvent: () => [TOPIC_NAME],
    handlers: new Map([[TOPIC_NAME, new Set(handlers)]]),
    config: {
      channel: 'channel'
    }
  }

  const event = { event: 'content' }

  try {
    await publish(pool, event)
    return Promise.reject('Test failed')
  } catch (e) {
    expect(e).toEqual(new Error('Adapter has been already disposed'))
  }
})

test('publish should call all handlers including failed one', async () => {
  const error = new Error('Test error')
  const handlerErr = sinon.stub().callsFake(async () => {
    throw error
  })
  const handlers = [sinon.stub(), handlerErr, sinon.stub()]

  const pool = {
    makeTopicsForEvent: () => [TOPIC_NAME],
    handlers: new Map([[TOPIC_NAME, new Set(handlers)]]),
    config: {
      channel: 'channel'
    }
  }

  const event = { event: 'content' }
  await publish(pool, event)

  sinon.assert.calledWith(handlers[0], event)
  sinon.assert.calledWith(handlers[1], event)
  sinon.assert.calledWith(handlers[2], event)
})
