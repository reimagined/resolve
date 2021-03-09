import * as AWS from 'aws-sdk'
import {
  CloudResourceOptions,
  PostgresqlAdapterConfig,
} from '@resolve-js/eventstore-postgresql-serverless'
import { Readable } from 'stream'

export function updateAwsConfig(): void {
  AWS.config.update({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  })
}

export function getCloudResourceOptions(
  databaseName: string
): CloudResourceOptions {
  return {
    eventsTableName: 'events',
    snapshotsTableName: 'snapshots',
    secretsTableName: 'secrets',
    subscribersTableName: 'subscribers',
    databaseName: databaseName,
    dbClusterOrInstanceArn: process.env.AWS_RDS_CLUSTER_ARN,
    awsSecretStoreAdminArn: process.env.AWS_RDS_ADMIN_SECRET_ARN,
    region: process.env.AWS_REGION ?? 'eu-central-1',
    userLogin: process.env.AWS_USER_NAME ?? 'master',
  }
}

export function cloudResourceOptionsToAdapterConfig(
  options: CloudResourceOptions
): PostgresqlAdapterConfig {
  return {
    eventsTableName: options.eventsTableName,
    snapshotsTableName: options.snapshotsTableName,
    secretsTableName: options.secretsTableName,
    subscribersTableName: options.subscribersTableName,
    databaseName: options.databaseName,
    dbClusterOrInstanceArn: options.dbClusterOrInstanceArn,
    awsSecretStoreArn: options.awsSecretStoreAdminArn,
    region: options.region,
  }
}

export const TEST_SERVERLESS = process.env.TEST_SERVERLESS === '1'

export function jestTimeout(): number {
  if (TEST_SERVERLESS) {
    return 1000 * 60 * 5
  } else {
    return 5000
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

export function makeTestEvent(eventIndex: number): any {
  return {
    aggregateId: 'aggregateId',
    aggregateVersion: eventIndex + 1,
    type: 'EVENT',
    payload: { eventIndex },
    timestamp: eventIndex + 1,
  }
}
