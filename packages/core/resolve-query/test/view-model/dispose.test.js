import sinon from 'sinon'

import dispose from '../../src/view-model/dispose'

test('View-model dispose should throw on bad options', async () => {
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

test('View-model dispose should provide dispose promise if disposing', async () => {
  const disposePromise = Promise.resolve()
  const result = dispose({ disposePromise })

  expect(result).toEqual(disposePromise)
})

test('View-model dispose should dispose view-model', async () => {
  const oneViewModelInstance = {}
  const twoViewModelInstance = {}

  const repository = {
    activeWorkers: new Map([
      ['one', oneViewModelInstance],
      ['two', twoViewModelInstance]
    ]),
    snapshotAdapter: {
      dispose: sinon.stub().callsFake(async () => null)
    }
  }

  const options = {}
  await dispose(repository, options)

  expect(repository.snapshotAdapter.dispose.callCount).toEqual(1)
  expect(repository.snapshotAdapter.dispose.firstCall.args[0]).toEqual(options)

  expect(oneViewModelInstance.disposed).toEqual(true)
  expect(twoViewModelInstance.disposed).toEqual(true)
})
