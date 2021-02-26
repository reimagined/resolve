import create from '../src/resource/create'
import { CloudResourcePool, CloudResourceOptions } from '../src'

/* eslint-disable import/no-extraneous-dependencies */
import RDSDataService from 'aws-sdk/clients/rdsdataservice'

test('connect should throw on wrong parameters', async () => {
  const pool = ({
    coercer: jest.fn(),
    escape: jest.fn(),
    escapeId: jest.fn(),
    executeStatement: jest.fn(),
    fullJitter: jest.fn(),
    shapeEvent: jest.fn(),
    connect: jest.fn(),
    dispose: jest.fn(),
    RDSDataService,
  } as any) as CloudResourcePool

  await expect(
    create(pool, ({
      region: '',
      databaseName: 42,
      eventsTableName: '',
      secretsTableName: '',
      snapshotsTableName: '',
      userLogin: '',
      awsSecretStoreAdminArn: '',
      dbClusterOrInstanceArn: '',
    } as any) as CloudResourceOptions)
  ).rejects.toThrow()
})
