import debugLevels from 'resolve-debug-levels'
import createAdapter from 'resolve-eventstore-lite'
import { Adapter } from 'resolve-eventstore-base'
import { SecretsManager } from 'resolve-core'
import { Readable, pipeline } from 'stream'
import { promisify } from 'util'

const logger = debugLevels('resolve:sqlite:secrets')
jest.setTimeout(5000)

function streamToString(stream: Readable): Promise<string> {
  const chunks: Buffer[] = []
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}

function makeSecretFromIndex(index: number): string {
  return `secret_${index}`
}

function makeIdFromIndex(index: number): string {
  return `id_${index}`
}

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

  test('should get secret by id', async () => {
    const secretManger: SecretsManager = await adapter.getSecretsManager()
    const randomIndex: number = Math.floor(Math.random() * countSecrets)
    const secret: string = await secretManger.getSecret(
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

  test('should correctly export secrets', async () => {
    const exportStream = await adapter.exportSecrets()
    const contents: string = await streamToString(exportStream)
    const secrets = contents.split('\n').filter((line) => line.length != 0)
    expect(secrets).toHaveLength(countSecrets)
    const parsedSecret: any = JSON.parse(secrets[0])
    expect(parsedSecret.secret).toBeDefined()
    expect(parsedSecret.id).toBeDefined()
    expect(parsedSecret.idx).toBeDefined()
  })

  test('should be able to load secrets continuously', async () => {
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

  test('should delete secret by id and return null secret for get by this id', async () => {
    const secretManger: SecretsManager = await adapter.getSecretsManager()
    const randomIndex: number = Math.floor(Math.random() * countSecrets)
    await secretManger.deleteSecret(makeIdFromIndex(randomIndex))
    const secret: string | null = await secretManger.getSecret(
      makeIdFromIndex(randomIndex)
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
        id: makeIdFromIndex(secretIndex),
        secret: makeSecretFromIndex(secretIndex),
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

describe('Sqlite eventstore adapter import secrets', () => {
  test('should correctly import exported secrets', async () => {
    const countSecrets = 50

    let inputAdapter: Adapter = createAdapter({})
    let outputAdapter: Adapter = createAdapter({})
    await inputAdapter.init()
    await outputAdapter.init()

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
})
