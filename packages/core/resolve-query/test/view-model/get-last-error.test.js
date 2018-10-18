import sinon from 'sinon'

import getLastError from '../../src/view-model/get-last-error'

test('View-model get last error should return null on non-existing view model', async () => {
  const repository = {
    getViewModel: sinon.stub().callsFake(() => null)
  }
  const result = await getLastError(repository)

  expect(repository.getViewModel.callCount).toEqual(1)
  expect(repository.getViewModel.firstCall.args[0]).toEqual(repository)
  expect(repository.getViewModel.firstCall.args[1]).toEqual(undefined)
  expect(repository.getViewModel.firstCall.args[2]).toEqual(false)

  expect(result).toEqual(null)
})

test('View-model get last error re-throw last error if exists', async () => {
  const viewModel = { lastError: new Error() }
  const repository = {
    getViewModel: sinon.stub().callsFake(() => viewModel)
  }
  const aggregateIds = ['a', 'b', 'c']
  const result = await getLastError(repository, { aggregateIds })

  expect(repository.getViewModel.callCount).toEqual(1)
  expect(repository.getViewModel.firstCall.args[0]).toEqual(repository)
  expect(repository.getViewModel.firstCall.args[1]).toEqual(aggregateIds)
  expect(repository.getViewModel.firstCall.args[2]).toEqual(false)

  expect(result).toEqual(viewModel.lastError)
})

test('View-model get last error should return null on non-init view model', async () => {
  const viewModel = {}
  const repository = {
    getViewModel: sinon.stub().callsFake(() => viewModel)
  }
  const aggregateIds = ['a', 'b', 'c']
  const result = await getLastError(repository, { aggregateIds })

  expect(repository.getViewModel.callCount).toEqual(1)
  expect(repository.getViewModel.firstCall.args[0]).toEqual(repository)
  expect(repository.getViewModel.firstCall.args[1]).toEqual(aggregateIds)
  expect(repository.getViewModel.firstCall.args[2]).toEqual(false)

  expect(result).toEqual(null)
})

test('View-model get last error should translate init error if exists', async () => {
  const viewModel = { initPromise: Promise.reject('INIT_ERROR') }
  const repository = {
    getViewModel: sinon.stub().callsFake(() => viewModel)
  }
  const aggregateIds = ['a', 'b', 'c']
  const result = await getLastError(repository, { aggregateIds })

  expect(repository.getViewModel.callCount).toEqual(1)
  expect(repository.getViewModel.firstCall.args[0]).toEqual(repository)
  expect(repository.getViewModel.firstCall.args[1]).toEqual(aggregateIds)
  expect(repository.getViewModel.firstCall.args[2]).toEqual(false)

  expect(result).toEqual('INIT_ERROR')
})

test('View-model get last error should return null if init success', async () => {
  const viewModel = { initPromise: Promise.resolve() }
  const repository = {
    getViewModel: sinon.stub().callsFake(() => viewModel)
  }
  const aggregateIds = ['a', 'b', 'c']
  const result = await getLastError(repository, { aggregateIds })

  expect(repository.getViewModel.callCount).toEqual(1)
  expect(repository.getViewModel.firstCall.args[0]).toEqual(repository)
  expect(repository.getViewModel.firstCall.args[1]).toEqual(aggregateIds)
  expect(repository.getViewModel.firstCall.args[2]).toEqual(false)

  expect(result).toEqual(null)
})
