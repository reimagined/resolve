import createSqliteAdapter from 'resolve-eventstore-lite'
import {
  Adapter,
  EventstoreResourceAlreadyExistError,
  EventstoreResourceNotExistError,
} from 'resolve-eventstore-base'

import { makeTestEvent } from '../eventstore-test-utils'

const createAdapter = createSqliteAdapter

describe('eventstore adapter init and drop', () => {
  const adapter: Adapter = createAdapter({})

  beforeAll(async () => {
    await adapter.init()
  })

  afterAll(async () => {
    await adapter.drop()
    await adapter.dispose()
  })

  test('should not throw when unfreezing not frozen adapter', async () => {
    await expect(adapter.unfreeze()).resolves.not.toThrow()
  })

  test('should not throw when freezing already frozen adapter', async () => {
    await adapter.freeze()
    await expect(adapter.freeze()).resolves.not.toThrow()
    await adapter.unfreeze()
  })

  test('should throw on saveEvent when adapter is frozen', async () => {
    await adapter.freeze()
    const event = makeTestEvent(0)
    await expect(adapter.saveEvent(event)).rejects.toThrow()
  })
  test('should be able to saveEvent after got unfrozen', async () => {
    await adapter.unfreeze()
    const event = makeTestEvent(0)
    await expect(adapter.saveEvent(event)).resolves.not.toThrow()
  })
})
