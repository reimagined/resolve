import sinon from 'sinon'

import projectionInvoker from '../../src/read-model/projection-invoker'

test('Read-model projection invoker should throw on disposed state', async () => {
  try {
    await projectionInvoker({ disposePromise: Promise.resolve() })
    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toEqual('Read model is disposed')
  }
})

test('Read-model projection invoker should re-throw last error', async () => {
  const lastError = new Error('Last error')
  try {
    await projectionInvoker({ lastError })
    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toEqual(lastError)
  }
})

test('Read-model projection invoker should invoke success projection', async () => {
  const repository = {
    projection: {
      EVENT_TYPE: sinon.stub().callsFake(async () => null)
    }
  }
  const event = { type: 'EVENT_TYPE' }
  await projectionInvoker(repository, event)

  expect(repository.projection.EVENT_TYPE.callCount).toEqual(1)
  expect(repository.projection.EVENT_TYPE.firstCall.args[0]).toEqual(event)
})

test('Read-model projection invoker should invoke failed projection', async () => {
  const projectionError = new Error()
  const repository = {
    projection: {
      EVENT_TYPE: sinon.stub().callsFake(async () => {
        throw projectionError
      })
    }
  }
  const event = { type: 'EVENT_TYPE' }
  try {
    await projectionInvoker(repository, event)
    return Promise.reject('Test failed')
  } catch (error) {
    expect(repository.projection.EVENT_TYPE.callCount).toEqual(1)
    expect(repository.projection.EVENT_TYPE.firstCall.args[0]).toEqual(event)

    expect(repository.lastError).toEqual(projectionError)
    expect(error).toEqual(projectionError)
  }
})
