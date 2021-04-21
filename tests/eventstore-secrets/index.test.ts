import {
  SET_SECRET_EVENT_TYPE,
  DELETE_SECRET_EVENT_TYPE,
} from '@resolve-js/eventstore-base'
import { SecretsManager } from '@resolve-js/core'
import { pipeline } from 'stream'
import { promisify } from 'util'
import {
  streamToString,
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

describe(`${adapterFactory.name}. Eventstore adapter secrets`, () => {
  beforeAll(adapterFactory.create('secret_testing'))
  afterAll(adapterFactory.destroy('secret_testing'))

  const adapter = adapters['secret_testing']

  const countSecrets = 50

  test('should load 0 secrets after initialization', async () => {
    const { secrets, idx } = await adapter.loadSecrets({ limit: countSecrets })
    expect(secrets).toHaveLength(0)
    expect(idx).toBeNull()
  })

  test('should set secrets', async () => {
    const secrets = []

    for (let secretIndex = 0; secretIndex < countSecrets; secretIndex++) {
      secrets.push({
        id: makeIdFromIndex(secretIndex),
        secret: makeSecretFromIndex(secretIndex),
      })
    }

    const secretManager: SecretsManager = await adapter.getSecretsManager()
    for (let secret of secrets) {
      await secretManager.setSecret(secret.id, secret.secret)
    }
  })

  test('should generate set secret events', async () => {
    const { events } = await adapter.loadEvents({
      cursor: null,
      limit: countSecrets,
      eventTypes: [SET_SECRET_EVENT_TYPE],
    })
    expect(events).toHaveLength(countSecrets)
  })

  test('should throw on setting secret with existing id', async () => {
    const secretManager: SecretsManager = await adapter.getSecretsManager()
    const randomIndex: number = Math.floor(Math.random() * countSecrets)

    await expect(
      secretManager.setSecret(
        makeIdFromIndex(randomIndex),
        makeSecretFromIndex(randomIndex)
      )
    ).rejects.toThrow()
  })

  test('should get secret by id', async () => {
    const secretManager: SecretsManager = await adapter.getSecretsManager()
    const randomIndex: number = Math.floor(Math.random() * countSecrets)
    const secret: string = await secretManager.getSecret(
      makeIdFromIndex(randomIndex)
    )
    expect(secret).toEqual(makeSecretFromIndex(randomIndex))
  })

  test('should load secrets and idx should increase monotonically', async () => {
    const { secrets } = await adapter.loadSecrets({ limit: countSecrets + 1 })
    expect(secrets).toHaveLength(countSecrets)
    expect(secrets[0].id).toEqual(makeIdFromIndex(0))
    for (let i = 1; i < secrets.length; ++i) {
      expect(secrets[i].idx).toBeGreaterThan(secrets[i - 1].idx)
    }
  })

  test('should load secrets and skip the provided number of rows', async () => {
    const skip = Math.floor(countSecrets / 3)
    const { secrets } = await adapter.loadSecrets({
      limit: countSecrets + 1,
      skip,
    })
    expect(secrets).toHaveLength(countSecrets - skip)
  })

  test('should correctly export secrets', async () => {
    const exportStream = await adapter.exportSecrets()
    const contents: string = await streamToString(exportStream)
    const secrets = contents.split('\n').filter((line) => line.length !== 0)
    expect(secrets).toHaveLength(countSecrets)
    const parsedSecret: any = JSON.parse(secrets[0])
    expect(parsedSecret.secret).toBeDefined()
    expect(parsedSecret.id).toBeDefined()
    expect(parsedSecret.idx).toBeDefined()
  })

  test('should be able to load secrets continuously by idx', async () => {
    const requestedCount = countSecrets / 2
    const { secrets, idx } = await adapter.loadSecrets({
      limit: requestedCount,
    })
    expect(secrets).toHaveLength(requestedCount)

    const loadResult = await adapter.loadSecrets({
      idx: idx,
      limit: countSecrets,
    })
    expect(loadResult.secrets).toHaveLength(countSecrets - requestedCount)
    const emptyResult = await adapter.loadSecrets({
      idx: loadResult.idx,
      limit: countSecrets,
    })
    expect(emptyResult.secrets).toHaveLength(0)
  })

  test('should be able to load secrets continuously by skip', async () => {
    const requestedCount = Math.floor(countSecrets / 3)
    const { secrets } = await adapter.loadSecrets({
      limit: requestedCount,
      skip: 0,
    })
    expect(secrets).toHaveLength(requestedCount)

    const loadResult = await adapter.loadSecrets({
      limit: countSecrets,
      skip: requestedCount,
    })
    expect(loadResult.secrets).toHaveLength(countSecrets - requestedCount)
    const emptyResult = await adapter.loadSecrets({
      limit: countSecrets,
      skip: countSecrets,
    })
    expect(emptyResult.secrets).toHaveLength(0)
  })

  test('should not generate delete secret event when deleting secret by non-existing id', async () => {
    const secretManager: SecretsManager = await adapter.getSecretsManager()
    const secretId = makeIdFromIndex(countSecrets)
    const result = await secretManager.deleteSecret(secretId)
    expect(result).toBe(false)

    const { events } = await adapter.loadEvents({
      cursor: null,
      limit: countSecrets,
      eventTypes: [DELETE_SECRET_EVENT_TYPE],
    })
    expect(events).toHaveLength(0)
  })

  const secretToDeleteIndex: number = Math.floor(Math.random() * countSecrets)

  test('should delete secret by id, return null for this id and generate delete secret event', async () => {
    const secretManager: SecretsManager = await adapter.getSecretsManager()
    const secretId = makeIdFromIndex(secretToDeleteIndex)
    const result = await secretManager.deleteSecret(secretId)
    expect(result).toBe(true)

    const secret: string | null = await secretManager.getSecret(secretId)
    expect(secret).toBeNull()

    const { events } = await adapter.loadEvents({
      cursor: null,
      limit: countSecrets,
      eventTypes: [DELETE_SECRET_EVENT_TYPE],
    })
    expect(events).toHaveLength(1)
    expect(events[0].payload.id).toEqual(secretId)
  })

  test('deleteSecret should return false when asked to delete non-existing or already deleted secret', async () => {
    const secretManager: SecretsManager = await adapter.getSecretsManager()
    const secretId = makeIdFromIndex(secretToDeleteIndex)
    const result = await secretManager.deleteSecret(secretId)
    expect(result).toBe(false)

    const nonExistingId = makeIdFromIndex(countSecrets)
    const resultNonExisting = await secretManager.deleteSecret(nonExistingId)
    expect(resultNonExisting).toBe(false)
  })

  test('should not generate additional delete secret event if secret has been already deleted', async () => {
    const { events } = await adapter.loadEvents({
      cursor: null,
      limit: countSecrets,
      eventTypes: [DELETE_SECRET_EVENT_TYPE],
    })
    expect(events).toHaveLength(1)
  })

  test('should return 1 less number of secrets after the secret was deleted', async () => {
    const secrets = (await adapter.loadSecrets({ limit: countSecrets + 1 }))
      .secrets
    expect(secrets).toHaveLength(countSecrets - 1)
  })

  test('should throw when setting secret with id that belonged to previously deleted secret', async () => {
    const secretManager: SecretsManager = await adapter.getSecretsManager()

    await expect(
      secretManager.setSecret(
        makeIdFromIndex(secretToDeleteIndex),
        makeSecretFromIndex(secretToDeleteIndex)
      )
    ).rejects.toThrow()
  })
})

describe(`${adapterFactory.name}. Eventstore adapter import secrets`, () => {
  beforeAll(async () => {
    await Promise.all([
      adapterFactory.create('secret_input_testing')(),
      adapterFactory.create('secret_output_testing')(),
    ])

    const outputAdapter = adapters['secret_output_testing']

    for (let eventIndex = 0; eventIndex < countEvents; ++eventIndex) {
      const event = makeTestEvent(eventIndex)
      await outputAdapter.saveEvent(event)
    }
  })
  afterAll(() =>
    Promise.all([
      adapterFactory.destroy('secret_input_testing')(),
      adapterFactory.destroy('secret_output_testing')(),
    ])
  )

  const inputAdapter = adapters['secret_input_testing']
  const outputAdapter = adapters['secret_output_testing']

  const countEvents = 50

  test('should correctly import exported secrets', async () => {
    const countSecrets = 50

    const secretManager: SecretsManager = await inputAdapter.getSecretsManager()
    for (let secretIndex = 0; secretIndex < countSecrets; secretIndex++) {
      await secretManager.setSecret(
        makeIdFromIndex(secretIndex),
        makeSecretFromIndex(secretIndex)
      )
    }

    await promisify(pipeline)(
      inputAdapter.exportSecrets(),
      outputAdapter.importSecrets()
    )

    const { secrets } = await outputAdapter.loadSecrets({ limit: countSecrets })

    expect(secrets.length).toEqual(countSecrets)
    for (let i = 1; i < secrets.length; ++i) {
      expect(secrets[i].idx).toBeGreaterThan(secrets[i - 1].idx)
    }
  })

  test('importing secrets should not drop events', async () => {
    const { events } = await outputAdapter.loadEvents({
      limit: countEvents,
      cursor: null,
    })
    expect(events.length).toEqual(countEvents)
  })
})
