import type {
  Adapter,
  InputEvent,
  StoredEvent,
} from '@resolve-js/eventstore-base'
import {
  EventstoreResourceNotExistError,
  initThreadArray,
} from '@resolve-js/eventstore-base'
import createSqliteAdapter, {
  SqliteAdapterConfig,
} from '@resolve-js/eventstore-lite'
import createPostgresqlAdapter, {
  create as createPostgresResource,
  destroy as destroyPostgresResource,
  PostgresqlAdapterConfig,
} from '@resolve-js/eventstore-postgresql'
import os from 'os'
import fs from 'fs'

import { Readable } from 'stream'

async function safeDrop(adapter: Adapter): Promise<void> {
  try {
    await adapter.drop()
  } catch (error) {
    if (!(error instanceof EventstoreResourceNotExistError)) {
      throw error
    }
  }
}

export function isPostgres(): boolean {
  if (
    process.env.TEST_POSTGRES !== undefined &&
    process.env.TEST_POSTGRES !== 'false'
  ) {
    if (process.env.POSTGRES_HOST == null) {
      throw new Error(`Environment variable POSTGRES_HOST is required`)
    }
    if (process.env.POSTGRES_PORT == null) {
      throw new Error(`Environment variable POSTGRES_PORT is required`)
    }
    if (process.env.POSTGRES_USER == null) {
      throw new Error(`Environment variable POSTGRES_USER is required`)
    }
    if (process.env.POSTGRES_PASSWORD == null) {
      throw new Error(`Environment variable POSTGRES_PASSWORD is required`)
    }
    if (process.env.POSTGRES_DATABASE == null) {
      throw new Error(`Environment variable POSTGRES_DATABASE is required`)
    }
    return true
  }
}

export function jestTimeout(): number {
  if (
    process.env.TEST_POSTGRES !== undefined &&
    process.env.TEST_POSTGRES !== 'false'
  ) {
    return 1000 * 60 * 2
  } else {
    return 1000 * 60 * 1
  }
}

export function streamToString(stream: Readable): Promise<string> {
  const chunks: Buffer[] = []
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}

export function makeTestEvent(eventIndex: number, data?: any): InputEvent {
  const payload: any = { eventIndex }
  if (data !== undefined) {
    payload.data = data
  }

  return {
    aggregateId: 'aggregateId',
    aggregateVersion: eventIndex + 1,
    type: 'EVENT',
    payload,
    timestamp: eventIndex + 1,
  }
}

export function makeTypedTestEvent(
  eventIndex: number,
  type: string
): InputEvent {
  return {
    aggregateId: 'aggregateId',
    aggregateVersion: eventIndex + 1,
    type: type,
    payload: { eventIndex },
    timestamp: eventIndex + 1,
  }
}

export function makeTestSavedEvent(
  eventIndex: number,
  threadArray: ReturnType<typeof initThreadArray>,
  data?: any
): StoredEvent {
  const payload: any = { eventIndex }
  if (data !== undefined) {
    payload.data = data
  }

  const threadId = Math.floor(Math.random() * threadArray.length)
  const event: StoredEvent = {
    aggregateId: 'aggregateId',
    aggregateVersion: eventIndex + 1,
    type: 'EVENT',
    payload,
    timestamp: eventIndex + 1,
    threadId,
    threadCounter: threadArray[threadId],
  }
  threadArray[threadId]++
  return event
}

let adapters: Record<string, Adapter> = {}

const proxy = new Proxy(
  {},
  {
    get(_: any, adapterName: string): Adapter {
      return new Proxy(
        {},
        {
          get(_: any, key: string): any {
            if (key === 'bind' || key === 'apply' || key === 'call') {
              return adapters[adapterName][key].bind(adapters[adapterName])
            } else {
              return adapters[adapterName][key]
            }
          },
          set() {
            throw new TypeError()
          },
        }
      ) as Adapter
    },
    set() {
      throw new TypeError()
    },
  }
) as typeof adapters

export const sqliteTempFileName = (uniqueName: string) =>
  `${os.tmpdir()}/test-${uniqueName}.db`

export { proxy as adapters }

export const adapterFactory = isPostgres()
  ? {
      name: '@resolve-js/eventstore-postgresql',
      create(
        uniqueName: string,
        additionalOptions?: Partial<PostgresqlAdapterConfig>
      ) {
        return async () => {
          adapters[uniqueName] = createPostgresqlAdapter({
            databaseName: uniqueName,
            database: process.env.POSTGRES_DATABASE,
            host: process.env.POSTGRES_HOST,
            port: +process.env.POSTGRES_PORT,
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            ...additionalOptions,
          })

          const options = {
            databaseName: uniqueName,
            database: process.env.POSTGRES_DATABASE,
            host: process.env.POSTGRES_HOST,
            port: +process.env.POSTGRES_PORT,
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            userLogin: process.env.POSTGRES_USER,
          }

          try {
            await destroyPostgresResource(options)
          } catch {}
          await createPostgresResource(options)

          await adapters[uniqueName].init()
        }
      },
      createNoInit(
        uniqueName: string,
        additionalOptions?: Partial<PostgresqlAdapterConfig>
      ) {
        return async () => {
          const adapter = createPostgresqlAdapter({
            databaseName: uniqueName,
            database: process.env.POSTGRES_DATABASE,
            host: process.env.POSTGRES_HOST,
            port: +process.env.POSTGRES_PORT,
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            ...additionalOptions,
          })
          await adapter.describe()
          return adapter
        }
      },
      destroy(uniqueName: string) {
        return async () => {
          await safeDrop(adapters[uniqueName])
          await adapters[uniqueName].dispose()

          const options = {
            databaseName: uniqueName,
            database: process.env.POSTGRES_DATABASE,
            host: process.env.POSTGRES_HOST,
            port: +process.env.POSTGRES_PORT,
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            userLogin: process.env.POSTGRES_USER,
          }
          await destroyPostgresResource(options)

          delete adapters[uniqueName]
        }
      },
    }
  : {
      name: '@resolve-js/eventstore-lite',
      create(
        uniqueName: string,
        additionalOptions?: Partial<SqliteAdapterConfig>
      ) {
        return async () => {
          adapters[uniqueName] = createSqliteAdapter({
            databaseFile: ':memory:',
            ...additionalOptions,
          })

          await adapters[uniqueName].init()
        }
      },
      createNoInit(
        uniqueName: string,
        additionalOptions?: Partial<SqliteAdapterConfig>
      ) {
        return async () => {
          const adapter = createSqliteAdapter({
            ...additionalOptions,
          })
          await adapter.describe()
          return adapter
        }
      },
      destroy(uniqueName: string) {
        return async () => {
          await safeDrop(adapters[uniqueName])
          await adapters[uniqueName].dispose()

          delete adapters[uniqueName]

          try {
            fs.unlinkSync(sqliteTempFileName(uniqueName))
          } catch (err) {
            // pass
          }
        }
      },
    }

export default adapterFactory
