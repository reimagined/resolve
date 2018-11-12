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
  const viewModel = {
    initPromise: Promise.resolve(),
    handler: sinon.stub().callsFake(async () => null),
    aggregateIds: null
  }
  const refreshFromStorage = true
  const repository = {
    eventTypes: ['EVENT_TYPE_1', 'EVENT_TYPE_2'],
    getViewModel: sinon.stub().callsFake(() => viewModel),
    viewMap: new Map([['KEY', viewModel]])
  }

  const events = [{ type: 'EVENT_TYPE_1' }, { type: 'EVENT_TYPE_2' }]

  await updateByEvents(repository, events, refreshFromStorage)

  expect(viewModel.handler.callCount).toEqual(2)
  expect(viewModel.handler.firstCall.args[0]).toEqual(events[0])
  expect(viewModel.handler.secondCall.args[0]).toEqual(events[1])
})

test('View-model update by events should update with bad projection', async () => {
  const viewModel = {
    initPromise: Promise.resolve(),
    handler: sinon.stub().callsFake(async () => {
      throw new Error('Projection failed')
    }),
    aggregateIds: null
  }
  const refreshFromStorage = true
  const repository = {
    eventTypes: ['EVENT_TYPE_1', 'EVENT_TYPE_2'],
    getViewModel: sinon.stub().callsFake(() => viewModel),
    viewMap: new Map([['KEY', viewModel]])
  }

  const events = [{ type: 'EVENT_TYPE_1' }, { type: 'EVENT_TYPE_2' }]

  await updateByEvents(repository, events, refreshFromStorage)

  expect(viewModel.handler.callCount).toEqual(1)
  expect(viewModel.handler.firstCall.args[0]).toEqual(events[0])
})
