import * as AWS from 'aws-sdk'
import {
  Adapter,
  EventstoreResourceNotExistError,
} from '@resolve-js/eventstore-base'
import createSqliteAdapter from '@resolve-js/eventstore-lite'
import createPostgresqlServerlessAdapter, {
  CloudResourceOptions,
  create as createResource,
  destroy as destroyResource,
} from '@resolve-js/eventstore-postgresql-serverless'
import createPostgresqlAdapter, {
  create as createPostgresResource,
  destroy as destroyPostgresResource,
} from '@resolve-js/eventstore-postgresql'
import { InputEvent } from '@resolve-js/eventstore-base'

import { Readable } from 'stream'

export function isPostgresServerless(): boolean {
  if (
    process.env.TEST_POSTGRES_SERVERLESS !== undefined &&
    process.env.TEST_POSTGRES_SERVERLESS !== 'false'
  ) {
    if (process.env.AWS_ACCESS_KEY_ID == null) {
      throw new Error(`Environment variable AWS_ACCESS_KEY_ID is required`)
    }
    if (process.env.AWS_SECRET_ACCESS_KEY == null) {
      throw new Error(`Environment variable AWS_SECRET_ACCESS_KEY is required`)
    }
    if (process.env.AWS_RDS_CLUSTER_ARN == null) {
      throw new Error(`Environment variable AWS_RDS_CLUSTER_ARN is required`)
    }
    if (process.env.AWS_RDS_ADMIN_SECRET_ARN == null) {
      throw new Error(
        `Environment variable AWS_RDS_ADMIN_SECRET_ARN is required`
      )
    }
    AWS.config.update({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
    return true
  }
}

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
    process.env.TEST_POSTGRES_SERVERLESS !== undefined &&
    process.env.TEST_POSTGRES_SERVERLESS !== 'false'
  ) {
    return 1000 * 60 * 5
  } else if (
    process.env.TEST_POSTGRES !== undefined &&
    process.env.TEST_POSTGRES !== 'false'
  ) {
    return 1000 * 60 * 2
  } else {
    return 1000 * 60 * 1
  }
}

export function isServerlessAdapter(): boolean {
  return (
    process.env.TEST_POSTGRES_SERVERLESS !== undefined &&
    process.env.TEST_POSTGRES_SERVERLESS !== 'false'
  )
}

export function streamToString(stream: Readable): Promise<string> {
  const chunks: Buffer[] = []
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}

export function makeTestEvent(eventIndex: number): InputEvent {
  return {
    aggregateId: 'aggregateId',
    aggregateVersion: eventIndex + 1,
    type: 'EVENT',
    payload: { eventIndex },
    timestamp: eventIndex + 1,
  }
}

const uniquePostfix = `${process.pid}_${Math.round(Math.random() * 1000)}`

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

export { proxy as adapters }

export function getPostgresServerlessOptions(
  uniqueName: string
): CloudResourceOptions {
  return {
    eventsTableName: 'events',
    snapshotsTableName: 'snapshots',
    secretsTableName: 'secrets',
    subscribersTableName: 'subscribers',
    databaseName: `${uniqueName}_${uniquePostfix}`,
    dbClusterOrInstanceArn: process.env.AWS_RDS_CLUSTER_ARN,
    awsSecretStoreAdminArn: process.env.AWS_RDS_ADMIN_SECRET_ARN,
    region: process.env.AWS_REGION ?? 'eu-central-1',
    userLogin: process.env.AWS_RDS_USERNAME ?? 'master',
  }
}

export const adapterFactory = isPostgresServerless()
  ? {
      name: '@resolve-js/eventstore-postgresql-serverless',
      create(uniqueName: string) {
        return async () => {
          const options = getPostgresServerlessOptions(uniqueName)

          try {
            await destroyResource(options)
          } catch {}
          await createResource(options)

          adapters[uniqueName] = createPostgresqlServerlessAdapter({
            eventsTableName: options.eventsTableName,
            snapshotsTableName: options.snapshotsTableName,
            secretsTableName: options.secretsTableName,
            subscribersTableName: options.subscribersTableName,
            databaseName: options.databaseName,
            dbClusterOrInstanceArn: options.dbClusterOrInstanceArn,
            awsSecretStoreArn: options.awsSecretStoreAdminArn,
            region: options.region,
          })

          await adapters[uniqueName].init()
        }
      },
      destroy(uniqueName: string) {
        return async () => {
          const options = getPostgresServerlessOptions(uniqueName)

          await safeDrop(adapters[uniqueName])
          await adapters[uniqueName].dispose()

          await destroyResource(options)

          delete adapters[uniqueName]
        }
      },
    }
  : isPostgres()
  ? {
      name: '@resolve-js/eventstore-postgresql',
      create(uniqueName: string) {
        return async () => {
          adapters[uniqueName] = createPostgresqlAdapter({
            databaseName: uniqueName,
            database: process.env.POSTGRES_DATABASE,
            host: process.env.POSTGRES_HOST,
            port: +process.env.POSTGRES_PORT,
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
          })

          const options = {
            databaseName: uniqueName,
            database: process.env.POSTGRES_DATABASE,
            host: process.env.POSTGRES_HOST,
            port: +process.env.POSTGRES_PORT,
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
          }

          try {
            await destroyPostgresResource(options)
          } catch {}
          await createPostgresResource(options)

          await adapters[uniqueName].init()
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
          }
          await destroyPostgresResource(options)

          delete adapters[uniqueName]
        }
      },
    }
  : {
      name: '@resolve-js/eventstore-lite',
      create(uniqueName: string) {
        return async () => {
          adapters[uniqueName] = createSqliteAdapter({
            eventsTableName: 'events',
            snapshotsTableName: 'snapshots',
            secretsTableName: 'secrets',
            subscribersTableName: 'subscribers',
            databaseFile: ':memory:',
          })

          await adapters[uniqueName].init()
        }
      },
      destroy(uniqueName: string) {
        return async () => {
          await safeDrop(adapters[uniqueName])
          await adapters[uniqueName].dispose()

          delete adapters[uniqueName]
        }
      },
    }

export default adapterFactory
