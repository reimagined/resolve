import sinon from 'sinon'

import updateByEvents from '../../src/read-model/update-by-events'

test('Read-model update by events should throw on disposed state', async () => {
  try {
    await updateByEvents(null, 123)
    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toEqual(
      'Updating by events should supply events array'
    )
  }
})

test('Read-model update by events should update by events with good projection', async () => {
  const repository = {
    getModelReadInterface: sinon.stub().callsFake(async () => null),
    boundProjectionInvoker: sinon.stub().callsFake(async () => null),
    eventTypes: ['EVENT_TYPE_1', 'EVENT_TYPE_2']
  }

  const events = [{ type: 'EVENT_TYPE_1' }, { type: 'EVENT_TYPE_2' }]

  await updateByEvents(repository, events)

  expect(repository.boundProjectionInvoker.callCount).toEqual(2)
  expect(repository.boundProjectionInvoker.firstCall.args[0]).toEqual(events[0])
  expect(repository.boundProjectionInvoker.secondCall.args[0]).toEqual(
    events[1]
  )

  expect(repository.getModelReadInterface.callCount).toEqual(0)
})

test('Read-model update by events should update by events with bad projection', async () => {
  const repository = {
    getModelReadInterface: sinon.stub().callsFake(async () => null),
    boundProjectionInvoker: sinon.stub().callsFake(async () => {
      throw new Error('Projection error')
    }),
    eventTypes: ['EVENT_TYPE_1', 'EVENT_TYPE_2']
  }

  const events = [{ type: 'EVENT_TYPE_1' }, { type: 'EVENT_TYPE_2' }]

  await updateByEvents(repository, events, true)

  expect(repository.boundProjectionInvoker.callCount).toEqual(1)
  expect(repository.boundProjectionInvoker.firstCall.args[0]).toEqual(events[0])

  expect(repository.getModelReadInterface.callCount).toEqual(0)
})
