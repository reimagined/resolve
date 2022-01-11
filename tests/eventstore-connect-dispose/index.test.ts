import {
  AlreadyDisposedError,
  Adapter,
  StoredEventPointer,
} from '@resolve-js/eventstore-base'

import {
  adapterFactory,
  jestTimeout,
  sqliteTempFileName,
  isPostgres,
} from '../eventstore-test-utils'

import { Client } from 'pg'

jest.setTimeout(jestTimeout())

function makeTestEvent(eventIndex: number) {
  return {
    aggregateVersion: 1,
    aggregateId: `ID_${eventIndex}`,
    type: 'TYPE',
    payload: { message: 'hello' },
    timestamp: 1,
  }
}

describe(`${adapterFactory.name}. Eventstore adapter connect and dispose`, () => {
  const dbName = 'connect_and_dispose_testing'
  let adapter: Adapter

  beforeAll(async () => {
    await adapterFactory.create(dbName, {
      databaseFile: sqliteTempFileName(dbName),
    })()
    adapter = await adapterFactory.createNoInit(dbName, {
      databaseFile: sqliteTempFileName(dbName),
    })()
  })
  afterAll(async () => {
    try {
      await adapter.dispose()
    } catch (error) {
      // ignore
    }
    await adapterFactory.destroy(dbName)()
  })

  test('should have zero connections on creation', async () => {
    const runtimeInfo = adapter.runtimeInfo()
    expect(runtimeInfo.connectionCount).toBe(0)
    expect(runtimeInfo.disposed).toBe(false)
  })

  test('should ensure connection on demand', async () => {
    await adapter.loadEvents({ limit: 1, cursor: null })
    const runtimeInfo = adapter.runtimeInfo()
    expect(runtimeInfo.connectionCount).toBe(1)
  })

  const maybeRunTest = isPostgres() ? test : test.skip

  maybeRunTest(
    'should create more connections when saveEvent is called with timeout and close them afterwards',
    async () => {
      adapter.establishTimeLimit(() => 10000)

      const promises: Promise<StoredEventPointer>[] = []
      for (let i = 0; i < 50; ++i) {
        promises.push(adapter.saveEvent(makeTestEvent(i)))
      }

      // This test is potentially unstable
      let hasExtraConnections = false
      for (let i = 0; i < 100 && !hasExtraConnections; ++i) {
        const runtimeInfo = adapter.runtimeInfo()
        if (runtimeInfo.connectionCount > 1) {
          hasExtraConnections = true
          break
        }
        await new Promise((resolve) => {
          setTimeout(resolve, 10)
        })
      }
      expect(hasExtraConnections).toBe(true)
      await Promise.all(promises)
      expect(adapter.runtimeInfo().connectionCount).toBe(1)
    }
  )

  test('should have "disposed" flag after got disposed and have zero connections', async () => {
    await adapter.dispose()
    const runtimeInfo = adapter.runtimeInfo()
    expect(runtimeInfo.disposed).toBe(true)
    expect(runtimeInfo.connectionCount).toBe(0)
  })

  test('should throw AlreadyDisposedError if trying to do some query after being disposed', async () => {
    try {
      await adapter.loadEvents({ limit: 1, cursor: null })
      expect(false).toBe(true)
    } catch (error) {
      expect(AlreadyDisposedError.is(error)).toBe(true)
    }
  })

  test('should throw AlreadyDisposedError if trying to dispose again', async () => {
    await expect(adapter.dispose()).rejects.toThrow(AlreadyDisposedError)
  })
})

const terminatorConfig = {
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: +process.env.POSTGRES_PORT,
}

function terminatingQuery(processID: number) {
  return `
        SELECT pg_terminate_backend(pid) FROM
        pg_stat_activity WHERE
        pid = ${processID}
        AND datname = '${process.env.POSTGRES_DATABASE}';`
}

const maybeDescribe = isPostgres() ? describe : describe.skip

maybeDescribe(
  `${adapterFactory.name}. Eventstore adapter dispose parallel to other operations`,
  () => {
    let adapter: Adapter

    beforeAll(async () => {
      await adapterFactory.create('dispose_parallel_testing')()
      adapter = await adapterFactory.createNoInit('dispose_parallel_testing')()
    })
    afterAll(async () => {
      try {
        await adapter.dispose()
      } catch (error) {
        // ignore
      }
      await adapterFactory.destroy('dispose_parallel_testing')()
    })

    test('Disposing the adapter should interrupt parallel save operations', async () => {
      adapter.establishTimeLimit(() => 10000)

      const saveEventCount = 100
      const promises: Promise<void>[] = []
      for (let i = 0; i < saveEventCount; ++i) {
        promises.push(
          adapter
            .saveEvent(makeTestEvent(i))
            .catch((error) => {
              if (!AlreadyDisposedError.is(error)) {
                throw error
              }
            })
            .then((value) => {
              void 0
            })
        )
      }

      await adapter.dispose()
      await Promise.all(promises)
      expect(adapter.runtimeInfo().connectionCount).toEqual(0)

      let describer: Adapter
      try {
        describer = await adapterFactory.createNoInit(
          'dispose_parallel_testing'
        )()
        const describeInfo = await describer.describe()
        expect(describeInfo.eventCount).toBeLessThan(saveEventCount)
      } finally {
        await describer.dispose()
      }
    })
  }
)

maybeDescribe(`${adapterFactory.name}. Eventstore adapter reconnection`, () => {
  let adapter: Adapter

  beforeAll(async () => {
    await adapterFactory.create('reconnection_testing')()
    adapter = await adapterFactory.createNoInit('reconnection_testing')()
  })
  afterAll(async () => {
    try {
      await adapter.dispose()
    } catch (error) {
      // ignore
    }
    await adapterFactory.destroy('reconnection_testing')()
  })

  const stableEventCount = 100

  test('Terminating the connection should not interrupt eventstore operations by default', async () => {
    const terminatingClient = new Client(terminatorConfig)
    try {
      await terminatingClient.connect()
      await adapter.loadEvents({ limit: 1, cursor: null })
      let runtimeInfo = adapter.runtimeInfo()
      expect(runtimeInfo.processID).toBeDefined()

      const promises: Promise<StoredEventPointer>[] = []
      for (let i = 0; i < stableEventCount; ++i) {
        promises.push(adapter.saveEvent(makeTestEvent(i)))
      }

      for (let i = 0; i < +runtimeInfo.maxReconnectionTimes; ++i) {
        await terminatingClient.query(terminatingQuery(runtimeInfo.processID))
        await new Promise((resolve) => {
          setTimeout(resolve, 50)
        })
      }

      await Promise.all(promises)
      runtimeInfo = adapter.runtimeInfo()
      expect(runtimeInfo.connectionCount).not.toBeGreaterThan(1)

      const describeInfo = await adapter.describe()
      expect(describeInfo.eventCount).toEqual(stableEventCount)
    } finally {
      await terminatingClient.end()
    }
  })

  test('Terminating the connection should interrupt eventstore operations if maxReconnectionTimes is 0', async () => {
    const terminatingClient = new Client(terminatorConfig)
    try {
      await terminatingClient.connect()

      await adapter.loadEvents({ limit: 1, cursor: null })

      adapter.setReconnectionMode({ maxReconnectionTimes: 0 })
      const runtimeInfo = adapter.runtimeInfo()
      expect(runtimeInfo.processID).toBeDefined()
      expect(runtimeInfo.maxReconnectionTimes).toBe(0)

      const unstableEventCount = 25

      const promises: Promise<null>[] = []
      for (let i = 0; i < unstableEventCount; ++i) {
        promises.push(
          adapter
            .saveEvent(makeTestEvent(stableEventCount + i))
            .catch((error) => null)
            .then((value) => null)
        )
      }
      await terminatingClient.query(terminatingQuery(runtimeInfo.processID))

      await Promise.all(promises)

      adapter.setReconnectionMode({ maxReconnectionTimes: 1 })
      const describeInfo = await adapter.describe()
      expect(describeInfo.eventCount).toBeLessThan(
        stableEventCount + unstableEventCount
      )

      await adapter.dispose()
      expect(adapter.runtimeInfo().connectionCount).toEqual(0)
    } finally {
      await terminatingClient.end()
    }
  })
})
