import createPostgresqlAdapter, {
  create as createPostgresResource,
  destroy as destroyPostgresResource,
} from '@resolve-js/eventstore-postgresql'
import createPostgresqlServerlessAdapter, {
  CloudResourceOptions,
  create as createResource,
  destroy as destroyResource,
} from '@resolve-js/eventstore-postgresql-serverless'

import fs from 'fs'
import { promisify } from 'util'
import { pipeline, Writable } from 'stream'
import { adapters } from './eventstore-test-utils'

const uniquePostfix = `${process.pid}_${Math.round(Math.random() * 1000)}`

function getPostgresServerlessOptions(
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

class WritableStreamBuffer extends Writable {
  constructor() {
    super({ decodeStrings: true })
  }

  _write(chunk: any, encoding: string, callback: (error?: Error) => void) {
    callback()
  }
}

;(async () => {
  const uniqueName = 'import-test'

  /*const adapter = createPostgresqlAdapter({
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
  await createPostgresResource(options)*/

  const options = getPostgresServerlessOptions(uniqueName)

  try {
    await destroyResource(options)
  } catch {}
  await createResource(options)

  const adapter = createPostgresqlServerlessAdapter({
    eventsTableName: options.eventsTableName,
    snapshotsTableName: options.snapshotsTableName,
    secretsTableName: options.secretsTableName,
    subscribersTableName: options.subscribersTableName,
    databaseName: options.databaseName,
    dbClusterOrInstanceArn: options.dbClusterOrInstanceArn,
    awsSecretStoreArn: options.awsSecretStoreAdminArn,
    region: options.region,
  })

  await adapter.init()

  const exportedEventsFileName = '../examples/ts/hacker-news/data/events.db'
  const importStream = adapter.importEvents()
  const fileStream = fs.createReadStream(exportedEventsFileName)

  const startImport = Date.now()
  await promisify(pipeline)(fileStream, importStream)
  const endImport = Date.now()

  console.log('Import elapsed seconds:', (endImport - startImport) / 1000)

  const exportStream = adapter.exportEvents()
  const writeStream = new WritableStreamBuffer()
  //const fileWriteStream = fs.createWriteStream('events.txt')

  const startExport = Date.now()
  await promisify(pipeline)(exportStream, writeStream)
  const endExport = Date.now()

  console.log('Export elapsed seconds:', (endExport - startExport) / 1000)

  await adapter.dispose()
  await destroyResource(options)
})()
