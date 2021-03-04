import createSqliteAdapter from '@resolve-js/eventstore-lite'
import createPostgresqlServerlessAdapter, {
  create,
  destroy,
} from '@resolve-js/eventstore-postgresql-serverless'
import {
  Adapter,
  EventstoreFrozenError,
  EventstoreAlreadyFrozenError,
  EventstoreAlreadyUnfrozenError,
} from '@resolve-js/eventstore-base'

import {
  TEST_SERVERLESS,
  updateAwsConfig,
  getCloudResourceOptions,
  jestTimeout,
  cloudResourceOptionsToAdapterConfig,
  makeTestEvent,
} from '../eventstore-test-utils'

jest.setTimeout(jestTimeout())

let createAdapter: (config: any) => Adapter

if (TEST_SERVERLESS) {
  createAdapter = createPostgresqlServerlessAdapter
} else {
  createAdapter = createSqliteAdapter
}

beforeAll(() => {
  if (TEST_SERVERLESS) updateAwsConfig()
})

describe('eventstore adapter freeze and unfreeze', () => {
  const options = getCloudResourceOptions('freeze_testing')

  let adapter: Adapter
  beforeAll(async () => {
    if (TEST_SERVERLESS) {
      await create(options)
      adapter = createAdapter(cloudResourceOptionsToAdapterConfig(options))
    } else {
      adapter = createAdapter({})
    }
    await adapter.init()
  })

  afterAll(async () => {
    await adapter.drop()
    await adapter.dispose()

    if (TEST_SERVERLESS) {
      await destroy(options)
    }
  })

  test('should throw when unfreezing not frozen adapter', async () => {
    await expect(adapter.unfreeze()).rejects.toThrow(
      EventstoreAlreadyUnfrozenError
    )
  })

  test('should throw when freezing already frozen adapter', async () => {
    await adapter.freeze()
    await expect(adapter.freeze()).rejects.toThrow(EventstoreAlreadyFrozenError)
    await adapter.unfreeze()
  })

  test('should throw on saveEvent when adapter is frozen', async () => {
    await adapter.freeze()
    const event = makeTestEvent(0)
    await expect(adapter.saveEvent(event)).rejects.toThrow(
      EventstoreFrozenError
    )
  })
  test('should be able to saveEvent after got unfrozen', async () => {
    await adapter.unfreeze()
    const event = makeTestEvent(0)
    await expect(adapter.saveEvent(event)).resolves.not.toThrow()
  })

  test('should throw on setSecret when adapter is frozen', async () => {
    await adapter.freeze()
    const secretManager = await adapter.getSecretsManager()
    await expect(
      secretManager.setSecret('secret_id', 'secret_content')
    ).rejects.toThrow(EventstoreFrozenError)
  })
  test('should be able to setSecret after got unfrozen', async () => {
    await adapter.unfreeze()
    const secretManager = await adapter.getSecretsManager()
    await expect(
      secretManager.setSecret('secret_id', 'secret_content')
    ).resolves.not.toThrow()
  })
})
