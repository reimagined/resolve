import * as AWS from 'aws-sdk'
import createAdapter from '@resolve-js/eventstore-postgresql-serverless'
import { create, destroy } from '@resolve-js/eventstore-postgresql-serverless'

import type { CloudResourceOptions } from '@resolve-js/eventstore-postgresql-serverless'

jest.setTimeout(1000 * 60 * 5)

test.skip('Postgres-serverless eventstore adapter should be able to save and load an event', async () => {
  AWS.config.update({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  })

  const options: CloudResourceOptions = {
    eventsTableName: 'events',
    snapshotsTableName: 'snapshots',
    secretsTableName: 'secrets',
    subscribersTableName: 'subscribers',
    databaseName: 'hello_world',
    dbClusterOrInstanceArn: process.env.AWS_RDS_CLUSTER_ARN,
    awsSecretStoreAdminArn: process.env.AWS_RDS_ADMIN_SECRET_ARN,
    region: process.env.AWS_REGION ?? 'eu-central-1',
    userLogin: process.env.AWS_USER_NAME ?? 'master',
  }

  await create(options)
  try {
    const adapter = createAdapter({
      eventsTableName: options.eventsTableName,
      snapshotsTableName: options.snapshotsTableName,
      secretsTableName: options.secretsTableName,
      databaseName: options.databaseName,
      dbClusterOrInstanceArn: options.dbClusterOrInstanceArn,
      awsSecretStoreArn: options.awsSecretStoreAdminArn,
      region: options.region,
    })
    await adapter.init()
    await adapter.saveEvent({
      aggregateVersion: 1,
      aggregateId: 'ID_1',
      type: 'TYPE_1',
      payload: { message: 'hello' },
      timestamp: 1,
    })
    const { events, cursor } = await adapter.loadEvents({
      eventTypes: null,
      aggregateIds: null,
      limit: 1,
      cursor: null,
    })
    expect(events).toHaveLength(1)
    expect(events[0].type).toEqual('TYPE_1')
    expect(events[0].payload).toEqual({ message: 'hello' })
    expect(events[0].timestamp).toBeGreaterThan(0)
    expect(typeof cursor).toBe('string')

    await adapter.drop()
  } finally {
    await destroy(options)
  }
})
