import sinon from 'sinon'

import dispose from '../../src/read-model/dispose'

test('Read-model dispose should throw on bad options', async () => {
  try {
    await dispose({}, 123)
    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toEqual(
      'Dispose options should be object or not be passed to use default behaviour'
    )
  }
})

test('Read-model dispose should provide dispose promise if disposing', async () => {
  const disposePromise = Promise.resolve()
  const result = dispose({ disposePromise })

  expect(result).toEqual(disposePromise)
})

test('Read-model dispose should do nothing if not initialized', async () => {
  const adapter = { reset: sinon.stub().callsFake(async () => null) }
  await dispose({ adapter })

  expect(adapter.reset.callCount).toEqual(0)
})

test('Read-model dispose should dispose if initialized', async () => {
  const disposeOptions = {}
  const adapter = { reset: sinon.stub().callsFake(async () => null) }
  const repository = { adapter, prepareProjection: () => null }
  const disposePromise = dispose(repository, disposeOptions)

  expect(repository).toEqual({ disposePromise })
  await disposePromise

  expect(adapter.reset.callCount).toEqual(1)
  expect(adapter.reset.firstCall.args[0]).toEqual(disposeOptions)
})
