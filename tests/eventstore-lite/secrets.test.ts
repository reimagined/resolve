import debugLevels from 'resolve-debug-levels'
import createAdapter from 'resolve-eventstore-lite'
import { Adapter } from 'resolve-eventstore-base'
import { SecretsManager } from 'resolve-core'

const logger = debugLevels('resolve:sqlite:secrets')
jest.setTimeout(5000)

describe('Sqlite eventstore adapter secrets', () => {
  const countSecrets = 50

  let adapter: Adapter
  beforeAll(async () => {
    adapter = createAdapter({})
    await adapter.init()
  })

  afterAll(async () => {
    await adapter.dispose()
  })

  test('should set secrets', async () => {
    const secrets = []

    for (let secretIndex = 0; secretIndex < countSecrets; secretIndex++) {
      secrets.push({
        id: `id_${secretIndex}`,
        secret: `secret_${secretIndex}`,
      })
    }

    const secretManager: SecretsManager = await adapter.getSecretsManager()
    for (let secret of secrets) {
      await secretManager.setSecret(secret.id, secret.secret)
    }
  })

  test('should get secret by id', async () => {
    const secretManger: SecretsManager = await adapter.getSecretsManager()
    const randomIndex: number = Math.floor(Math.random() * countSecrets)
    const secret: string = await secretManger.getSecret(`id_${randomIndex}`)
    expect(secret).toEqual(`secret_${randomIndex}`)
  })

  test('should load secrets', async () => {
    const secrets = (await adapter.loadSecrets({ limit: countSecrets + 1 }))
      .secrets
    expect(secrets).toHaveLength(countSecrets)
  })

  test('should delete secret by id and return null secret for get by this id', async () => {
    const secretManger: SecretsManager = await adapter.getSecretsManager()
    const randomIndex: number = Math.floor(Math.random() * countSecrets)
    await secretManger.deleteSecret(`id_${randomIndex}`)
    const secret: string | null = await secretManger.getSecret(
      `id_${randomIndex}`
    )
    expect(secret).toBeNull()
  })

  test('should return 1 less number of secrets after the secret was deleted', async () => {
    const secrets = (await adapter.loadSecrets({ limit: countSecrets + 1 }))
      .secrets
    expect(secrets).toHaveLength(countSecrets - 1)
  })
})

describe('Sqlite eventstore adapter inject secrets', () => {
  const countSecrets = 50

  let adapter: Adapter
  beforeAll(async () => {
    adapter = createAdapter({})
    await adapter.init()
  })

  afterAll(async () => {
    await adapter.dispose()
  })

  test('should inject secrets into empty table', async () => {
    const secrets = []

    for (let secretIndex = 0; secretIndex < countSecrets; secretIndex++) {
      secrets.push({
        id: `id_${secretIndex}`,
        secret: `secret_${secretIndex}`,
        idx: secretIndex,
      })
    }

    for (let secret of secrets) {
      await adapter.injectSecret(secret)
    }
  })

  test('should load injected secrets', async () => {
    const secrets = (await adapter.loadSecrets({ limit: countSecrets + 1 }))
      .secrets
    expect(secrets).toHaveLength(countSecrets)
  })
})
