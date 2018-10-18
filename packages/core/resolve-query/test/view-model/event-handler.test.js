import sinon from 'sinon'

import eventHandler from '../../src/view-model/event-handler'

test('View-model event handler should throw on disposed view model', async () => {
  const repository = {
    projection: {},
    snapshotAdapter: {},
    serializeState: sinon.stub()
  }
  const viewModel = {
    disposed: true
  }

  try {
    await eventHandler(repository, viewModel, {})
    return Promise.reject()
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toEqual('View model is disposed')
  }
})

test('View-model event handler should re-throw last error', async () => {
  const repository = {
    projection: {},
    snapshotAdapter: null,
    serializeState: sinon.stub()
  }
  const viewModel = {
    lastError: new Error()
  }

  try {
    await eventHandler(repository, viewModel, {})
    return Promise.reject()
  } catch (error) {
    expect(error).toEqual(viewModel.lastError)
  }
})

// eslint-disable-next-line max-len
test('View-model event handler should handle correct event with correct version without snapshot adapter', async () => {
  const repository = {
    projection: {
      EVENT_TYPE: sinon.stub().callsFake(() => 'NEXT_VIEW_MODEL_STATE')
    },
    snapshotAdapter: null,
    serializeState: sinon.stub()
  }

  const viewModel = {
    state: 'PREVIOUS_VIEW_MODEL_STATE',
    aggregatesVersionsMap: new Map([['root-id', 10]]),
    lastTimestamp: 100
  }

  const event = {
    aggregateId: 'root-id',
    aggregateVersion: 11,
    type: 'EVENT_TYPE',
    timestamp: 200
  }

  await eventHandler(repository, viewModel, event)

  expect(repository.projection.EVENT_TYPE.callCount).toEqual(1)
  expect(repository.projection.EVENT_TYPE.firstCall.args[0]).toEqual(
    'PREVIOUS_VIEW_MODEL_STATE'
  )
  expect(repository.projection.EVENT_TYPE.firstCall.args[1]).toEqual(event)

  expect(viewModel.state).toEqual('NEXT_VIEW_MODEL_STATE')

  expect(viewModel.aggregatesVersionsMap.get('root-id')).toEqual(11)

  expect(viewModel.lastTimestamp).toEqual(199)
})

// eslint-disable-next-line max-len
test('View-model event handler should handle correct event with first version without snapshot adapter', async () => {
  const repository = {
    projection: {
      EVENT_TYPE: sinon.stub().callsFake(() => 'NEXT_VIEW_MODEL_STATE')
    },
    snapshotAdapter: null,
    serializeState: sinon.stub()
  }

  const viewModel = {
    aggregatesVersionsMap: new Map(),
    state: 'PREVIOUS_VIEW_MODEL_STATE',
    lastTimestamp: 100
  }

  const event = {
    aggregateId: 'root-id',
    aggregateVersion: 1,
    type: 'EVENT_TYPE',
    timestamp: 200
  }

  await eventHandler(repository, viewModel, event)

  expect(repository.projection.EVENT_TYPE.callCount).toEqual(1)
  expect(repository.projection.EVENT_TYPE.firstCall.args[0]).toEqual(
    'PREVIOUS_VIEW_MODEL_STATE'
  )
  expect(repository.projection.EVENT_TYPE.firstCall.args[1]).toEqual(event)

  expect(viewModel.state).toEqual('NEXT_VIEW_MODEL_STATE')

  expect(viewModel.aggregatesVersionsMap.get('root-id')).toEqual(1)

  expect(viewModel.lastTimestamp).toEqual(199)
})

// eslint-disable-next-line max-len
test('View-model event handler should not handle correct event with wrong version without snapshot adapter', async () => {
  const repository = {
    projection: {
      EVENT_TYPE: sinon.stub().callsFake(() => 'NEXT_VIEW_MODEL_STATE')
    },
    snapshotAdapter: null,
    serializeState: sinon.stub()
  }

  const viewModel = {
    state: 'PREVIOUS_VIEW_MODEL_STATE',
    aggregatesVersionsMap: new Map([['root-id', 11]]),
    lastTimestamp: 100
  }

  const event = {
    aggregateId: 'root-id',
    aggregateVersion: 11,
    type: 'EVENT_TYPE',
    timestamp: 200
  }

  await eventHandler(repository, viewModel, event)

  expect(repository.projection.EVENT_TYPE.callCount).toEqual(0)

  expect(viewModel.state).toEqual('PREVIOUS_VIEW_MODEL_STATE')

  expect(viewModel.aggregatesVersionsMap.get('root-id')).toEqual(11)

  expect(viewModel.lastTimestamp).toEqual(100)
})

// eslint-disable-next-line max-len
test('View-model event handler should handle correct event with correct version with snapshot adapter', async () => {
  const repository = {
    projection: {
      EVENT_TYPE: sinon.stub().callsFake(() => 'NEXT_VIEW_MODEL_STATE')
    },
    snapshotAdapter: {
      saveSnapshot: sinon.stub().callsFake(async () => null)
    },
    serializeState: sinon.stub().callsFake(() => 'SERIALIZED_STATE')
  }

  const viewModel = {
    state: 'PREVIOUS_VIEW_MODEL_STATE',
    aggregatesVersionsMap: new Map([['root-id', 10]]),
    lastTimestamp: 100,
    snapshotKey: 'SNAPSHOT_KEY'
  }

  const event = {
    aggregateId: 'root-id',
    aggregateVersion: 11,
    type: 'EVENT_TYPE',
    timestamp: 200
  }

  await eventHandler(repository, viewModel, event)

  expect(repository.projection.EVENT_TYPE.callCount).toEqual(1)
  expect(repository.projection.EVENT_TYPE.firstCall.args[0]).toEqual(
    'PREVIOUS_VIEW_MODEL_STATE'
  )
  expect(repository.projection.EVENT_TYPE.firstCall.args[1]).toEqual(event)

  expect(viewModel.state).toEqual('NEXT_VIEW_MODEL_STATE')

  expect(viewModel.aggregatesVersionsMap.get('root-id')).toEqual(11)

  expect(viewModel.lastTimestamp).toEqual(199)

  expect(repository.snapshotAdapter.saveSnapshot.callCount).toEqual(1)
  expect(repository.snapshotAdapter.saveSnapshot.firstCall.args[0]).toEqual(
    'SNAPSHOT_KEY'
  )
  expect(repository.snapshotAdapter.saveSnapshot.firstCall.args[1]).toEqual({
    aggregatesVersionsMap: Array.from(viewModel.aggregatesVersionsMap),
    lastTimestamp: viewModel.lastTimestamp,
    state: 'SERIALIZED_STATE'
  })

  expect(repository.serializeState.callCount).toEqual(1)
  expect(repository.serializeState.firstCall.args[0]).toEqual(
    'NEXT_VIEW_MODEL_STATE'
  )
})

test('View-model event handler should handle wrong event ', async () => {
  const projectionError = new Error()
  const repository = {
    projection: {
      EVENT_TYPE: sinon.stub().callsFake(() => {
        throw projectionError
      })
    },
    snapshotAdapter: null,
    serializeState: sinon.stub()
  }

  const viewModel = {
    state: 'PREVIOUS_VIEW_MODEL_STATE',
    aggregatesVersionsMap: new Map([['root-id', 10]]),
    lastTimestamp: 100
  }

  const event = {
    aggregateId: 'root-id',
    aggregateVersion: 11,
    type: 'EVENT_TYPE',
    timestamp: 200
  }

  try {
    await eventHandler(repository, viewModel, event)
    return Promise.reject('TEST FAILED')
  } catch (error) {
    expect(error).toEqual(projectionError)

    expect(repository.projection.EVENT_TYPE.callCount).toEqual(1)
    expect(repository.projection.EVENT_TYPE.firstCall.args[0]).toEqual(
      'PREVIOUS_VIEW_MODEL_STATE'
    )
    expect(repository.projection.EVENT_TYPE.firstCall.args[1]).toEqual(event)

    expect(viewModel.state).toEqual('PREVIOUS_VIEW_MODEL_STATE')

    expect(viewModel.aggregatesVersionsMap.get('root-id')).toEqual(10)

    expect(viewModel.lastTimestamp).toEqual(100)
  }
})
