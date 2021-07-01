import {
  Adapter,
  ReplicationState,
  OldSecretRecord,
  OldEvent,
  ReplicationAlreadyInProgress,
} from '@resolve-js/eventstore-base'
import {
  jestTimeout,
  makeTestEvent,
  adapterFactory,
  adapters,
} from '../eventstore-test-utils'

jest.setTimeout(jestTimeout())

function makeSecretFromIndex(index: number): string {
  return `secret_${index}`
}

function makeIdFromIndex(index: number): string {
  return `id_${index}`
}

function generateSecrets(secretCount: number): OldSecretRecord[] {
  const secretRecords: OldSecretRecord[] = []

  for (let i = 0; i < secretCount; ++i) {
    secretRecords.push({
      id: makeIdFromIndex(i),
      idx: i,
      secret: makeSecretFromIndex(i),
    })
  }
  return secretRecords
}

describe(`${adapterFactory.name}. eventstore adapter replication state`, () => {
  beforeAll(adapterFactory.create('test_replication'))
  afterAll(adapterFactory.destroy('test_replication'))
  const adapter: Adapter = adapters['test_replication']

  test('get-replication-state should return default state', async () => {
    const state: ReplicationState = await adapter.getReplicationState()

    expect(state.status).toEqual('notStarted')
    expect(state.statusData).toBeNull()
    expect(state.iterator).toBeNull()
    expect(state.paused).toEqual(false)
  })

  test('set-replication-status should change status, statusData properties of the state', async () => {
    await adapter.setReplicationStatus('batchInProgress', {
      info: 'in progress',
    })
    let state = await adapter.getReplicationState()
    expect(state.status).toEqual('batchInProgress')
    expect(state.statusData).toEqual({ info: 'in progress' })

    await adapter.setReplicationStatus('batchDone')
    state = await adapter.getReplicationState()
    expect(state.status).toEqual('batchDone')
    expect(state.statusData).toEqual(null)
  })

  test('set-replication-status should set lastEvent and not rewrite it if it was not provided', async () => {
    const event: OldEvent = {
      aggregateId: 'aggregateId',
      aggregateVersion: 1,
      timestamp: 1,
      type: 'type',
    }

    await adapter.setReplicationStatus('batchDone', null, event)
    let state = await adapter.getReplicationState()
    expect(state.status).toEqual('batchDone')
    expect(state.successEvent).toEqual(event)

    await adapter.setReplicationStatus('error')
    state = await adapter.getReplicationState()
    expect(state.status).toEqual('error')
    expect(state.successEvent).toEqual(event)
  })

  test('set-replication-status should throw ReplicationAlreadyInProgress if replication is already in progress', async () => {
    await adapter.setReplicationStatus('batchInProgress')
    await expect(
      adapter.setReplicationStatus('batchInProgress')
    ).rejects.toThrow(ReplicationAlreadyInProgress)
  })

  test('set-replication-iterator should change iterator property of the state', async () => {
    await adapter.setReplicationIterator({ cursor: 'DEAF' })
    const state = await adapter.getReplicationState()
    expect(state.iterator).toEqual({ cursor: 'DEAF' })
  })

  test('set-replication-paused should change paused property of the state', async () => {
    await adapter.setReplicationPaused(true)
    let state = await adapter.getReplicationState()
    expect(state.paused).toEqual(true)

    await adapter.setReplicationPaused(false)
    state = await adapter.getReplicationState()
    expect(state.paused).toEqual(false)
  })

  const secretCount = 36

  test('replicate-secrets should be able to set secrets', async () => {
    const secretRecords: OldSecretRecord[] = generateSecrets(secretCount)

    await adapter.replicateSecrets(secretRecords, [])
    const { secrets: loadedSecrets } = await adapter.loadSecrets({
      limit: secretCount,
    })

    expect(loadedSecrets).toHaveLength(secretCount)
    expect(loadedSecrets[0].id).toEqual(makeIdFromIndex(0))
    expect(loadedSecrets[0].secret).toEqual(makeSecretFromIndex(0))
  })

  test('replicate-secrets should be able to delete secrets', async () => {
    const secretsToDelete: Array<OldSecretRecord['id']> = []
    for (
      let i = Math.floor(secretCount / 3);
      i < secretCount - Math.floor(secretCount / 3);
      ++i
    ) {
      secretsToDelete.push(makeIdFromIndex(i))
    }
    await adapter.replicateSecrets([], secretsToDelete)
    const { secrets: loadedSecrets } = await adapter.loadSecrets({
      limit: secretCount,
    })
    expect(loadedSecrets).toHaveLength(secretCount - secretsToDelete.length)

    const { secrets: loadedSecretsIncludeDeleted } = await adapter.loadSecrets({
      limit: secretCount,
      includeDeleted: true,
    })
    expect(loadedSecretsIncludeDeleted).toHaveLength(secretCount)
  })

  const additionalSecretCount = Math.floor(secretCount / 2)
  const startIndexToDelete = Math.floor(secretCount / 4)
  const endIndexToDelete = secretCount - Math.floor(secretCount / 4)
  const deletedSecretsCount = endIndexToDelete - startIndexToDelete

  test('replicate-secrets should be able to set and delete secrets in one go', async () => {
    const secretsToSet: OldSecretRecord[] = []

    for (let i = secretCount; i < secretCount + additionalSecretCount; ++i) {
      secretsToSet.push({
        id: makeIdFromIndex(i),
        idx: i,
        secret: makeSecretFromIndex(i),
      })
    }

    const secretsToDelete: Array<OldSecretRecord['id']> = []
    for (let i = startIndexToDelete; i < endIndexToDelete; ++i) {
      secretsToDelete.push(makeIdFromIndex(i))
    }

    await adapter.replicateSecrets(secretsToSet, secretsToDelete)
    const { secrets: loadedSecrets } = await adapter.loadSecrets({
      limit: secretCount * 2,
    })
    expect(loadedSecrets).toHaveLength(
      secretCount - deletedSecretsCount + secretsToSet.length
    )
  })

  test('replicate-secrets should ignore secrets with same id, but set new ones', async () => {
    const secretsToSet: OldSecretRecord[] = []

    for (let i = 0; i < secretCount + additionalSecretCount * 2; ++i) {
      secretsToSet.push({
        id: makeIdFromIndex(i),
        idx: i,
        secret: makeSecretFromIndex(i),
      })
    }

    await adapter.replicateSecrets(secretsToSet, [])
    const { secrets: loadedSecrets } = await adapter.loadSecrets({
      limit: secretCount * 2,
    })

    expect(loadedSecrets).toHaveLength(
      secretCount - deletedSecretsCount + additionalSecretCount * 2
    )
  })

  test('replicate-secrets should be no-op if input arrays are empty', async () => {
    const { secrets: loadedSecrets } = await adapter.loadSecrets({
      limit: secretCount * 2,
    })
    await adapter.replicateSecrets([], [])
    const { secrets: loadedAgainSecrets } = await adapter.loadSecrets({
      limit: secretCount * 2,
    })
    expect(loadedSecrets).toEqual(loadedAgainSecrets)
  })

  const eventCount = 2560

  test('replicate-events should insert events', async () => {
    const events: OldEvent[] = []
    for (let i = 0; i < eventCount; ++i) {
      events.push(makeTestEvent(i))
    }

    await adapter.replicateEvents(events)

    let loadedEventCount = 0
    let currentCursor = null
    while (loadedEventCount < eventCount) {
      const { events, cursor: nextCursor } = await adapter.loadEvents({
        limit: 100,
        cursor: currentCursor,
      })
      loadedEventCount += events.length
      currentCursor = nextCursor
    }

    expect(loadedEventCount).toEqual(eventCount)
  })

  const eventIndexAfterGap = eventCount + Math.floor(eventCount / 2)

  test('replicate-events should ignore duplicates', async () => {
    const addEventCount = 100

    const eventsAfterGap: OldEvent[] = []
    for (let i = eventIndexAfterGap; i < eventCount + addEventCount; ++i) {
      eventsAfterGap.push(makeTestEvent(i))
    }
    await adapter.replicateEvents(eventsAfterGap)

    const events: OldEvent[] = []
    for (let i = eventCount; i < eventCount + addEventCount; ++i) {
      events.push(makeTestEvent(i))
    }
    await adapter.replicateEvents(events)

    let loadedEventCount = 0
    let currentCursor = null
    while (loadedEventCount < eventCount + addEventCount) {
      const { events, cursor: nextCursor } = await adapter.loadEvents({
        limit: 100,
        cursor: currentCursor,
      })
      loadedEventCount += events.length
      currentCursor = nextCursor
    }

    expect(loadedEventCount).toEqual(eventCount + addEventCount)
  })

  test('reset-replication should remove all events and secrets and reset state', async () => {
    await adapter.resetReplication()
    const { events } = await adapter.loadEvents({
      cursor: null,
      limit: eventCount,
    })
    const { secrets } = await adapter.loadSecrets({
      limit: secretCount,
    })
    expect(events).toHaveLength(0)
    expect(secrets).toHaveLength(0)

    const state = await adapter.getReplicationState()
    expect(state.status).toEqual('notStarted')
    expect(state.statusData).toBeNull()
    expect(state.iterator).toBeNull()
  })

  const lessEventCount = 128
  test('should be able to replicate secrets and events after reset', async () => {
    const secretRecords: OldSecretRecord[] = generateSecrets(secretCount)

    await adapter.replicateSecrets(secretRecords, [])
    const { secrets: loadedSecrets } = await adapter.loadSecrets({
      limit: secretCount,
    })

    expect(loadedSecrets).toHaveLength(secretCount)

    const events: OldEvent[] = []
    for (let i = 0; i < lessEventCount; ++i) {
      events.push(makeTestEvent(i))
    }

    await adapter.replicateEvents(events)
    const { events: loadedEvents } = await adapter.loadEvents({
      limit: lessEventCount,
      cursor: null,
    })
    expect(loadedEvents).toHaveLength(lessEventCount)
  })

  test('should be able to save event and secret after replication', async () => {
    await adapter.saveEvent(makeTestEvent(lessEventCount))
    const secretManager = await adapter.getSecretsManager()
    await secretManager.setSecret(
      makeIdFromIndex(secretCount),
      makeSecretFromIndex(secretCount)
    )

    const { events: loadedEvents } = await adapter.loadEvents({
      limit: lessEventCount + 1,
      cursor: null,
    })
    expect(loadedEvents).toHaveLength(lessEventCount + 1)
  })
})
