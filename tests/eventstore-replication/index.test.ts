import createSqliteAdapter from '@resolve-js/eventstore-lite'
import {
  Adapter,
  ReplicationState,
  OldSecretRecord,
} from '@resolve-js/eventstore-base'

const createAdapter = createSqliteAdapter

function makeSecretFromIndex(index: number): string {
  return `secret_${index}`
}

function makeIdFromIndex(index: number): string {
  return `id_${index}`
}

describe('eventstore adapter replication state', () => {
  let adapter: Adapter
  beforeAll(async () => {
    adapter = createAdapter({})
    await adapter.init()
  })

  afterAll(async () => {
    await adapter.drop()
    await adapter.dispose()
  })

  test('get-replication-state should return default state', async () => {
    const state: ReplicationState = await adapter.getReplicationState()

    expect(state.status).toEqual('notStarted')
    expect(state.statusData).toBeNull()
    expect(state.iterator).toBeNull()
    expect(state.paused).toEqual(false)
  })

  test('set-replication-status should change status and statusData properties of the state', async () => {
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
    const secretRecords: OldSecretRecord[] = []

    for (let i = 0; i < secretCount; ++i) {
      secretRecords.push({
        id: makeIdFromIndex(i),
        idx: i,
        secret: makeSecretFromIndex(i),
      })
    }

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
    for (let i = secretCount / 3; i < secretCount - secretCount / 3; ++i) {
      secretsToDelete.push(makeIdFromIndex(i))
    }
    await adapter.replicateSecrets([], secretsToDelete)
    const { secrets: loadedSecrets } = await adapter.loadSecrets({
      limit: secretCount,
    })
    expect(loadedSecrets).toHaveLength(secretCount - secretsToDelete.length)
  })

  test('replicate-secrets-should be able to set and delete secrets in one go', async () => {
    const secretsToSet: OldSecretRecord[] = []

    for (let i = secretCount; i < secretCount + secretCount / 2; ++i) {
      secretsToSet.push({
        id: makeIdFromIndex(i),
        idx: i,
        secret: makeSecretFromIndex(i),
      })
    }

    const secretsToDelete: Array<OldSecretRecord['id']> = []
    for (let i = secretCount / 3; i < secretCount - secretCount / 3; ++i) {
      secretsToDelete.push(makeIdFromIndex(i))
    }

    await adapter.replicateSecrets(secretsToSet, secretsToDelete)
    const { secrets: loadedSecrets } = await adapter.loadSecrets({
      limit: secretCount * 2,
    })
    expect(loadedSecrets).toHaveLength(
      secretCount - secretsToDelete.length + secretsToSet.length
    )
  })

  test('replicate-secrets-should be no-op if input arrays are empty', async () => {
    const { secrets: loadedSecrets } = await adapter.loadSecrets({
      limit: secretCount * 2,
    })
    await adapter.replicateSecrets([], [])
    const { secrets: loadedAgainSecrets } = await adapter.loadSecrets({
      limit: secretCount * 2,
    })
    expect(loadedSecrets).toEqual(loadedAgainSecrets)
  })
})
