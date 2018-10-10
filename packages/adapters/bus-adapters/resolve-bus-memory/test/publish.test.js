import sinon from 'sinon'
import publish from '../src/publish'

test('publish should work correctly', async () => {
  const pool = {
    handlers: [sinon.stub(), sinon.stub(), sinon.stub()],
    config: {
      channel: 'channel'
    }
  }

  const event = { event: 'content' }

  await publish(pool, event)

  sinon.assert.calledWith(pool.handlers[0], event)
  sinon.assert.calledWith(pool.handlers[1], event)
  sinon.assert.calledWith(pool.handlers[2], event)
})

test('publish causes exception', async () => {
  const pool = {
    disposed: true,
    handlers: [sinon.stub(), sinon.stub(), sinon.stub()],
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
  const pool = {
    handlers: [sinon.stub(), handlerErr, sinon.stub()],
    config: {
      channel: 'channel'
    }
  }

  const event = { event: 'content' }
  await publish(pool, event)
  
  sinon.assert.calledWith(pool.handlers[0], event)
  sinon.assert.calledWith(pool.handlers[1], event)
  sinon.assert.calledWith(pool.handlers[2], event)
})
