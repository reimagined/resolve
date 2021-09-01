import { adapterFactory, adapters, jestTimeout } from '../eventstore-test-utils'
import type { EventWithCursor, Adapter } from '@resolve-js/eventstore-base'
import { SecretsManager } from '@resolve-js/core'

jest.setTimeout(jestTimeout())

describe(`${adapterFactory.name}. Eventstore adapter parallel save`, () => {
  const parallelAdapters: Adapter[] = []
  const parallelConnections = 10

  beforeAll(async () => {
    await adapterFactory.create('parallel_write_testing')()
    for (let i = 0; i < parallelConnections; ++i) {
      parallelAdapters.push(
        await adapterFactory.createNoInit('parallel_write_testing')()
      )
    }
  })
  afterAll(async () => {
    await Promise.all(parallelAdapters.map((adapter) => adapter.dispose()))
    await adapterFactory.destroy('parallel_write_testing')()
  })

  const adapter = adapters['parallel_write_testing']

  const getRandomAdapterInstance = () => {
    return parallelAdapters[Math.floor(Math.random() * parallelAdapters.length)]
  }

  const parallelWrites = 200
  let lastCursor: string
  let lastIdx: number
  test('should be able to save many events in parallel', async () => {
    const promises: Promise<EventWithCursor>[] = []
    for (let i = 0; i < parallelWrites; ++i) {
      promises.push(
        getRandomAdapterInstance().saveEvent({
          aggregateVersion: 1,
          aggregateId: `PARALLEL_ID_${i}`,
          type: 'PARALLEL_TYPE',
          payload: { message: 'hello' },
          timestamp: 1,
        })
      )
    }
    const parallelEventCursorPairs: EventWithCursor[] = await Promise.all(
      promises
    )

    expect(parallelEventCursorPairs).toHaveLength(parallelWrites)

    const { events, cursor } = await adapter.loadEvents({
      cursor: null,
      limit: parallelWrites,
      eventTypes: ['PARALLEL_TYPE'],
    })
    lastCursor = cursor
    expect(events).toHaveLength(parallelWrites)
  })

  test('should be able to save many secrets in parallel', async () => {
    const promises: Promise<void>[] = []
    for (let i = 0; i < parallelWrites; ++i) {
      const secretManager: SecretsManager = await getRandomAdapterInstance().getSecretsManager()
      promises.push(secretManager.setSecret(`id_${i}`, `secret_${i}`))
    }
    await Promise.all(promises)

    const { secrets, idx } = await adapter.loadSecrets({
      limit: parallelWrites,
    })
    lastIdx = idx
    expect(secrets).toHaveLength(parallelWrites)
  })

  let expectedSecretCount = 0
  test('should be able to save many events and secrets mixed up in parallel', async () => {
    const promises: Promise<any>[] = []

    let expectedEventCount = 0
    for (let i = 0; i < parallelWrites; ++i) {
      if (Math.random() >= 0.5) {
        const secretManager: SecretsManager = await getRandomAdapterInstance().getSecretsManager()
        expectedSecretCount++
        promises.push(secretManager.setSecret(`id_mix_${i}`, `secret_mix_${i}`))
      } else {
        expectedEventCount++
        promises.push(
          getRandomAdapterInstance().saveEvent({
            aggregateVersion: 1,
            aggregateId: `PARALLEL_ID_MIX_${i}`,
            type: 'PARALLEL_TYPE_MIX',
            payload: { message: 'hello' },
            timestamp: 1,
          })
        )
      }
    }
    await Promise.all(promises)

    const { secrets } = await adapter.loadSecrets({
      limit: parallelWrites,
      idx: lastIdx,
    })
    expect(secrets).toHaveLength(expectedSecretCount)

    const { events } = await adapter.loadEvents({
      limit: parallelWrites,
      cursor: lastCursor,
      eventTypes: ['PARALLEL_TYPE_MIX'],
    })
    expect(events).toHaveLength(expectedEventCount)
  })

  test('should be able to delete many secrets while saving events in parallel', async () => {
    const promises: Promise<any>[] = []
    let expectedDeletedSecretCount = 0
    let expectedEventCount = 0
    for (let i = 0; i < parallelWrites; ++i) {
      if (Math.random() >= 0.5) {
        const secretManager: SecretsManager = await getRandomAdapterInstance().getSecretsManager()
        expectedDeletedSecretCount++
        promises.push(secretManager.deleteSecret(`id_${i}`))
      } else {
        expectedEventCount++
        promises.push(
          getRandomAdapterInstance().saveEvent({
            aggregateVersion: 1,
            aggregateId: `PARALLEL_ID_MIX2_${i}`,
            type: 'PARALLEL_TYPE_MIX2',
            payload: { message: 'hello' },
            timestamp: 1,
          })
        )
      }
    }
    await Promise.all(promises)
    const { events } = await adapter.loadEvents({
      limit: parallelWrites,
      cursor: null,
      eventTypes: ['PARALLEL_TYPE_MIX2'],
    })
    expect(events).toHaveLength(expectedEventCount)

    const { secrets } = await adapter.loadSecrets({
      limit: parallelWrites + expectedSecretCount,
    })
    expect(secrets).toHaveLength(
      parallelWrites + expectedSecretCount - expectedDeletedSecretCount
    )
  })
})
