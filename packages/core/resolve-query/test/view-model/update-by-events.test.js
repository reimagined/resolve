import sinon from 'sinon'

import updateByEvents from '../../src/view-model/update-by-events'

test('View-model update by events should fail on non-array argument', async () => {
  try {
    // eslint-disable-next-line no-sparse-arrays
    await updateByEvents(...[, , 123])
    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toEqual(
      'Updating by events should supply events array'
    )
  }
})

test('View-model update by events should update with good projection', async () => {
  const aggregateIds = ['a', 'b', 'c', 'd']
  const viewModel = {
    initPromise: Promise.resolve(),
    handler: sinon.stub().callsFake(async () => null)
  }
  const refreshFromStorage = true
  const repository = {
    getViewModel: sinon.stub().callsFake(() => viewModel)
  }

  const events = [{ type: 'EVENT_TYPE_1' }, { type: 'EVENT_TYPE_2' }]

  await updateByEvents(repository, { aggregateIds }, events, refreshFromStorage)

  expect(repository.getViewModel.callCount).toEqual(1)
  expect(repository.getViewModel.firstCall.args[0]).toEqual(repository)
  expect(repository.getViewModel.firstCall.args[1]).toEqual(aggregateIds)
  expect(repository.getViewModel.firstCall.args[2]).toEqual(true)
  expect(repository.getViewModel.firstCall.args[3]).toEqual(!refreshFromStorage)

  expect(viewModel.handler.callCount).toEqual(2)
  expect(viewModel.handler.firstCall.args[0]).toEqual(events[0])
  expect(viewModel.handler.secondCall.args[0]).toEqual(events[1])
})

test('View-model update by events should update with bad projection', async () => {
  const aggregateIds = ['a', 'b', 'c', 'd']
  const viewModel = {
    initPromise: Promise.resolve(),
    handler: sinon.stub().callsFake(async () => {
      throw new Error('Projection failed')
    })
  }
  const refreshFromStorage = true
  const repository = {
    getViewModel: sinon.stub().callsFake(() => viewModel)
  }

  const events = [{ type: 'EVENT_TYPE_1' }, { type: 'EVENT_TYPE_2' }]

  await updateByEvents(repository, { aggregateIds }, events, refreshFromStorage)

  expect(repository.getViewModel.callCount).toEqual(1)
  expect(repository.getViewModel.firstCall.args[0]).toEqual(repository)
  expect(repository.getViewModel.firstCall.args[1]).toEqual(aggregateIds)
  expect(repository.getViewModel.firstCall.args[2]).toEqual(true)
  expect(repository.getViewModel.firstCall.args[3]).toEqual(!refreshFromStorage)

  expect(viewModel.handler.callCount).toEqual(1)
  expect(viewModel.handler.firstCall.args[0]).toEqual(events[0])
})
