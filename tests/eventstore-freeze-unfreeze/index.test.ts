import {
  EventstoreFrozenError,
  EventstoreAlreadyFrozenError,
  EventstoreAlreadyUnfrozenError,
} from '@resolve-js/eventstore-base'

import {
  jestTimeout,
  makeTestEvent,
  adapterFactory,
  adapters,
} from '../eventstore-test-utils'

jest.setTimeout(jestTimeout())

describe(`${adapterFactory.name}. Eventstore adapter freeze and unfreeze`, () => {
  beforeAll(adapterFactory.create('freeze_testing'))
  afterAll(adapterFactory.destroy('freeze_testing'))

  const adapter = adapters['freeze_testing']

  test('should throw when unfreezing not frozen adapter', async () => {
    const description = await adapter.describe()
    expect(description.isFrozen).toEqual(false)

    await expect(adapter.unfreeze()).rejects.toThrow(
      EventstoreAlreadyUnfrozenError
    )
  })

  test('should throw when freezing already frozen adapter', async () => {
    await adapter.freeze()
    let description = await adapter.describe()
    expect(description.isFrozen).toEqual(true)

    await expect(adapter.freeze()).rejects.toThrow(EventstoreAlreadyFrozenError)

    await adapter.unfreeze()
    description = await adapter.describe()
    expect(description.isFrozen).toEqual(false)
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
