import sinon from 'sinon'

import getModelReadInterface from '../../src/read-model/get-model-read-interface'

test('Read-model get model read interface should throw on disposed state', async () => {
  try {
    await getModelReadInterface({ disposePromise: Promise.resolve() })
    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toEqual('Read model is disposed')
  }
})

// eslint-disable-next-line max-len
test('Read-model get model read interface should provide interface when initialized already', async () => {
  const readInterface = {}
  const repository = {
    getReadInterface: sinon.stub().callsFake(async () => readInterface),
    loadDonePromise: Promise.resolve()
  }

  const result = await getModelReadInterface(repository)

  expect(result).toEqual(readInterface)
})

// eslint-disable-next-line max-len
test('Read-model get model read interface should try init when not initialized with success', async () => {
  const initPromise = Promise.resolve()
  const readInterface = {}
  const repository = {
    init: sinon.stub().callsFake(() => initPromise),
    getReadInterface: sinon.stub().callsFake(async () => readInterface)
  }
  const skipEventReadingArg = true
  const result = await getModelReadInterface(repository, skipEventReadingArg)

  expect(repository.loadDonePromise).toEqual(initPromise)

  expect(repository.init.callCount).toEqual(1)
  expect(repository.init.firstCall.args[0]).toEqual(repository)
  expect(repository.init.firstCall.args[1]).toEqual(skipEventReadingArg)

  expect(result).toEqual(readInterface)
})

// eslint-disable-next-line max-len
test('Read-model get model read interface should try init when not initialized with failure', async () => {
  const initPromise = Promise.reject()
  const repository = {
    init: sinon.stub().callsFake(() => initPromise)
  }
  const skipEventReadingArg = true
  const result = await getModelReadInterface(repository, skipEventReadingArg)

  expect(repository.loadDonePromise).toEqual(initPromise)

  expect(repository.init.callCount).toEqual(1)
  expect(repository.init.firstCall.args[0]).toEqual(repository)
  expect(repository.init.firstCall.args[1]).toEqual(skipEventReadingArg)

  expect(result).toEqual(null)
})
