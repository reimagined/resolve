import sinon from 'sinon'

import read from '../../src/view-model/read'

test('View-model read should fail on wrong aggregates ids', async () => {
  try {
    await read(null)
    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toEqual(
      'View models are build up only with aggregateIds array or wildcard argument'
    )
  }
})

test('View-model read should read view model with success returns state', async () => {
  const viewModel = {
    initPromise: Promise.resolve(),
    state: 'VIEW_MODEL_STATE'
  }
  const repository = {
    getViewModel: sinon.stub().callsFake(() => viewModel)
  }
  const aggregateIds = ['a', 'b', 'c', 'd']

  const result = await read(repository, { aggregateIds })

  expect(repository.getViewModel.callCount).toEqual(2)
  expect(repository.getViewModel.firstCall.args[0]).toEqual(repository)
  expect(repository.getViewModel.firstCall.args[1]).toEqual(aggregateIds)
  expect(repository.getViewModel.firstCall.args[2]).toEqual(true)

  expect(result).toEqual('VIEW_MODEL_STATE')
})

test('View-model read should read view model with failure returns null', async () => {
  const viewModel = {
    initPromise: Promise.reject(),
    state: 'VIEW_MODEL_STATE'
  }
  const repository = {
    getViewModel: sinon.stub().callsFake(() => viewModel)
  }
  const aggregateIds = ['a', 'b', 'c', 'd']

  const result = await read(repository, { aggregateIds })

  expect(repository.getViewModel.callCount).toEqual(1)
  expect(repository.getViewModel.firstCall.args[0]).toEqual(repository)
  expect(repository.getViewModel.firstCall.args[1]).toEqual(aggregateIds)
  expect(repository.getViewModel.firstCall.args[2]).toEqual(true)

  expect(result).toEqual(null)
})
