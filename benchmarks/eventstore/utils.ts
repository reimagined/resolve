import type {
  Adapter,
  InputEvent,
  StoredEvent,
} from '@resolve-js/eventstore-base'

import path from 'path'
import fs from 'fs'
import { promisify } from 'util'
import { pipeline } from 'stream'
import createPostgresqlAdapter, {
  create as createPostgresResource,
  PostgresqlAdapterConfig,
} from '@resolve-js/eventstore-postgresql'

export function getPostgresqlConfig(
  uniqueName: string
): PostgresqlAdapterConfig {
  return {
    databaseName: uniqueName,
    database: process.env.POSTGRES_DATABASE,
    host:
      process.env.POSTGRES_HOST !== undefined
        ? process.env.POSTGRES_HOST
        : 'localhost',
    port:
      process.env.POSTGRES_PORT !== undefined
        ? +process.env.POSTGRES_PORT
        : 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  }
}

export function createAdapter(uniqueName: string) {
  const config = getPostgresqlConfig(uniqueName)
  return createPostgresqlAdapter(config)
}

export async function createEventstore(uniqueName: string) {
  const config = getPostgresqlConfig(uniqueName)
  await createPostgresResource({ ...config, userLogin: config.user })

  const adapter = createAdapter(uniqueName)
  try {
    await adapter.init()
  } finally {
    await adapter.dispose()
  }
}

export async function importEventstore(adapter: Adapter, esDirectory: string) {
  const eventsPath = path.join(esDirectory, 'events.db')
  const secretsPath = path.join(esDirectory, 'secrets.db')

  const eventsStream = fs.createReadStream(eventsPath)
  await promisify(pipeline)(eventsStream, adapter.importEvents())
  eventsStream.close()

  const secretsStream = fs.createReadStream(secretsPath)
  await promisify(pipeline)(secretsStream, adapter.importSecrets())
  secretsStream.close()
}
