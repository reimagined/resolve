import sinon from 'sinon'

import getViewModel from '../../src/view-model/get-view-model'

test('View-model get view model should get view model and pass if init already', async () => {
  const viewModel = { initPromise: Promise.resolve() }
  const aggregateIds = ['a', 'b', 'c', 'd']
  const skipEventReading = true
  const repository = {
    viewMap: new Map([['KEY', viewModel]]),
    getKey: sinon.stub().callsFake(() => 'KEY'),
    init: sinon.stub()
  }
  const result = await getViewModel(
    repository,
    aggregateIds,
    true,
    skipEventReading
  )

  expect(repository.getKey.callCount).toEqual(1)
  expect(repository.getKey.firstCall.args[0]).toEqual(aggregateIds)

  expect(repository.init.callCount).toEqual(0)

  expect(result).toEqual(viewModel)
})

test('View-model get view model should get view model and perform initialization', async () => {
  const viewModel = {}
  const aggregateIds = ['a', 'b', 'c', 'd']
  const skipEventReading = true
  const repository = {
    viewMap: new Map([['KEY', viewModel]]),
    getKey: sinon.stub().callsFake(() => 'KEY'),
    init: sinon.stub()
  }
  const result = await getViewModel(
    repository,
    aggregateIds,
    true,
    skipEventReading
  )

  expect(repository.getKey.callCount).toEqual(1)
  expect(repository.getKey.firstCall.args[0]).toEqual(aggregateIds)

  expect(repository.init.callCount).toEqual(1)
  expect(repository.init.firstCall.args[0]).toEqual(repository)
  expect(repository.init.firstCall.args[1]).toEqual('KEY')
  expect(repository.init.firstCall.args[2]).toEqual(aggregateIds)
  expect(repository.init.firstCall.args[3]).toEqual(skipEventReading)

  expect(repository.init.firstCall.returnValue).toEqual(repository.initPromise)

  expect(result).toEqual(viewModel)
})

// eslint-disable-next-line max-len
test('View-model get view model should create view model and perform initialization', async () => {
  const aggregateIds = ['a', 'b', 'c', 'd']
  const skipEventReading = true
  const repository = {
    viewMap: new Map(),
    getKey: sinon.stub().callsFake(() => 'KEY'),
    init: sinon.stub()
  }
  const result = await getViewModel(
    repository,
    aggregateIds,
    true,
    skipEventReading
  )

  const viewModel = repository.viewMap.get('KEY')
  expect(repository.getKey.callCount).toEqual(1)
  expect(repository.getKey.firstCall.args[0]).toEqual(aggregateIds)

  expect(repository.init.callCount).toEqual(1)
  expect(repository.init.firstCall.args[0]).toEqual(repository)
  expect(repository.init.firstCall.args[1]).toEqual('KEY')
  expect(repository.init.firstCall.args[2]).toEqual(aggregateIds)
  expect(repository.init.firstCall.args[3]).toEqual(skipEventReading)

  expect(repository.init.firstCall.returnValue).toEqual(repository.initPromise)

  expect(result).toEqual(viewModel)
})

test('View-model get view model should not view model if flag not set', async () => {
  const aggregateIds = ['a', 'b', 'c', 'd']
  const repository = {
    viewMap: new Map(),
    getKey: sinon.stub().callsFake(() => 'KEY'),
    init: sinon.stub()
  }
  const result = await getViewModel(repository, aggregateIds, false)

  expect(repository.viewMap.has('KEY')).toEqual(false)
  expect(repository.getKey.callCount).toEqual(1)
  expect(repository.getKey.firstCall.args[0]).toEqual(aggregateIds)

  expect(repository.init.callCount).toEqual(0)

  expect(result).toEqual(null)
})
