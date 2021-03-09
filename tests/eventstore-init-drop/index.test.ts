import createSqliteAdapter from '@resolve-js/eventstore-lite'
import {
  Adapter,
  EventstoreResourceAlreadyExistError,
  EventstoreResourceNotExistError,
} from '@resolve-js/eventstore-base'

const createAdapter = createSqliteAdapter

describe('eventstore adapter init and drop', () => {
  const adapter: Adapter = createAdapter({})

  test('should init successfully', async () => {
    await expect(adapter.init()).resolves.not.toThrow(
      EventstoreResourceAlreadyExistError
    )
  })

  test('should throw on repeated init', async () => {
    await expect(adapter.init()).rejects.toThrow()
  })

  test('should drop successfully', async () => {
    await expect(adapter.drop()).resolves.not.toThrow()
  })

  test('should throw on repeated drop', async () => {
    await expect(adapter.drop()).rejects.toThrow(
      EventstoreResourceNotExistError
    )
  })
})
