import {
  EventstoreResourceAlreadyExistError,
  EventstoreResourceNotExistError,
} from '@resolve-js/eventstore-base'

import { adapterFactory, adapters } from '../eventstore-test-utils'

describe(`${adapterFactory.name}. Eventstore adapter init and drop`, () => {
  beforeAll(adapterFactory.create('init_and_drop_testing'))
  afterAll(adapterFactory.destroy('init_and_drop_testing'))

  const adapter = adapters['init_and_drop_testing']

  test('should throw on repeated init', async () => {
    await expect(adapter.init()).rejects.toThrow(
      EventstoreResourceAlreadyExistError
    )
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
