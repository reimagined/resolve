/* eslint-disable import/no-extraneous-dependencies */
import RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { mocked } from 'ts-jest/utils'
/* eslint-enable import/no-extraneous-dependencies */
import { AdapterPool, AdapterSpecific } from '../src/types'
import connect from '../src/connect'

jest.mock('get-log')

let rdsRelatedConfig: any
let pool: AdapterPool
let specific: AdapterSpecific

const mRDSDataService = mocked(RDSDataService)

beforeEach(() => {
  rdsRelatedConfig = {
    rdsRelatedOption: 'rds-option',
  }
  pool = {
    config: {
      dbClusterOrInstanceArn: 'instance-arn',
      awsSecretStoreArn: 'secret-store-arn',
      eventsTableName: 'table',
      databaseName: 'database',
      secretsTableName: 'secrets-table',
      ...rdsRelatedConfig,
    },
    coerceEmptyString: jest.fn(),
    beginTransaction: jest.fn(),
    coercer: jest.fn(),
    commitTransaction: jest.fn(),
    escape: jest.fn(),
    escapeId: jest.fn(),
    executeStatement: jest.fn(),
    fullJitter: jest.fn(),
    isTimeoutError: jest.fn(),
    rollbackTransaction: jest.fn(),
  } as any
  specific = {
    coercer: jest.fn(),
    escape: jest.fn(),
    escapeId: jest.fn(),
    executeStatement: jest.fn(),
    fullJitter: jest.fn(),
    RDSDataService,
  }
})

test('RDS client configured', async () => {
  await connect(pool, specific)

  expect(mRDSDataService).toHaveBeenCalledWith(rdsRelatedConfig)
})

test("cloud config assigned to adapter's pool", async () => {
  await connect(pool, specific)

  expect(pool).toEqual(
    expect.objectContaining({
      awsSecretStoreArn: 'secret-store-arn',
      beginTransaction: pool.beginTransaction,
      coerceEmptyString: pool.coerceEmptyString,
      coercer: pool.coercer,
      commitTransaction: pool.commitTransaction,
      config: {
        awsSecretStoreArn: 'secret-store-arn',
        databaseName: 'database',
        dbClusterOrInstanceArn: 'instance-arn',
        eventsTableName: 'table',
        rdsRelatedOption: 'rds-option',
        secretsTableName: 'secrets-table',
      },
      databaseName: undefined,
      dbClusterOrInstanceArn: 'instance-arn',
      escape: pool.escape,
      escapeId: pool.escapeId,
      eventsTableName: undefined,
      executeStatement: pool.executeStatement,
      fullJitter: pool.fullJitter,
      isTimeoutError: pool.isTimeoutError,
      rdsDataService: {},
      rollbackTransaction: pool.rollbackTransaction,
      secretsTableName: undefined,
      snapshotsTableName: undefined,
    })
  )
  expect(pool).toEqual(
    expect.objectContaining({
      fullJitter: specific.fullJitter,
      coercer: specific.coercer,
      escape: specific.escape,
      escapeId: specific.escapeId,
    })
  )
  expect(pool.rdsDataService).toBeInstanceOf(RDSDataService)

  if (pool.executeStatement) {
    await pool.executeStatement('test')
    expect(specific.executeStatement).toHaveBeenCalledWith(pool, 'test')
  }
})

test("utilities were assigned to adapter's pool", async () => {
  await connect(pool, specific)

  expect(pool).toEqual(
    expect.objectContaining({
      fullJitter: specific.fullJitter,
      coercer: specific.coercer,
      escape: specific.escape,
      escapeId: specific.escapeId,
    })
  )
})

test("rds data service client assigned to adapter's pool", async () => {
  await connect(pool, specific)

  expect(pool.rdsDataService).toBeInstanceOf(RDSDataService)
})

test("executeStatement bound to adapter's pool", async () => {
  await connect(pool, specific)

  expect(pool.executeStatement).toBeDefined()
  if (pool.executeStatement) {
    await pool.executeStatement('test')
    expect(specific.executeStatement).toHaveBeenCalledWith(pool, 'test')
  }
})
