/* eslint-disable import/no-extraneous-dependencies */
import RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { mocked } from 'ts-jest/utils'
/* eslint-enable import/no-extraneous-dependencies */
import {
  AdapterPool,
  ConnectionDependencies,
  PostgresqlAdapterConfig,
} from '../src/types'
import connect from '../src/connect'

jest.mock('get-log')

let rdsRelatedConfig: any
let pool: AdapterPool
let connectionDependencies: ConnectionDependencies
let config: PostgresqlAdapterConfig

const mRDSDataService = mocked(RDSDataService)

beforeEach(() => {
  rdsRelatedConfig = {
    rdsRelatedOption: 'rds-option',
  }
  pool = {
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
  connectionDependencies = {
    coercer: jest.fn(),
    escape: jest.fn(),
    escapeId: jest.fn(),
    executeStatement: jest.fn(),
    fullJitter: jest.fn(),
    RDSDataService,
  }
  config = {
    dbClusterOrInstanceArn: 'instance-arn',
    awsSecretStoreArn: 'secret-store-arn',
    eventsTableName: 'table',
    databaseName: 'database',
    secretsTableName: 'secrets-table',
    ...rdsRelatedConfig,
  }
})

test('connect should throw on wrong parameters', async () => {
  await expect(
    connect(pool, connectionDependencies, ({
      databaseName: 42,
      dbClusterOrInstanceArn: 'AAA',
      awsSecretStoreArn: 'BBB',
    } as any) as PostgresqlAdapterConfig)
  ).rejects.toThrow()
})

test('RDS client configured', async () => {
  await connect(pool, connectionDependencies, config)

  expect(mRDSDataService).toHaveBeenCalledWith(rdsRelatedConfig)
})

test("cloud config assigned to adapter's pool", async () => {
  await connect(pool, connectionDependencies, config)

  expect(pool).toEqual(
    expect.objectContaining({
      awsSecretStoreArn: 'secret-store-arn',
      beginTransaction: pool.beginTransaction,
      coercer: pool.coercer,
      commitTransaction: pool.commitTransaction,
      databaseName: 'database',
      dbClusterOrInstanceArn: 'instance-arn',
      escape: pool.escape,
      escapeId: pool.escapeId,
      eventsTableName: 'table',
      executeStatement: pool.executeStatement,
      fullJitter: pool.fullJitter,
      isTimeoutError: pool.isTimeoutError,
      rdsDataService: {},
      rollbackTransaction: pool.rollbackTransaction,
      secretsTableName: 'secrets-table',
    })
  )
  expect(pool).toEqual(
    expect.objectContaining({
      fullJitter: connectionDependencies.fullJitter,
      coercer: connectionDependencies.coercer,
      escape: connectionDependencies.escape,
      escapeId: connectionDependencies.escapeId,
    })
  )
  expect(pool.rdsDataService).toBeInstanceOf(RDSDataService)

  if (pool.executeStatement) {
    await pool.executeStatement('test')
    expect(connectionDependencies.executeStatement).toHaveBeenCalledWith(
      pool,
      'test'
    )
  }
})

test("utilities were assigned to adapter's pool", async () => {
  await connect(pool, connectionDependencies, config)

  expect(pool).toEqual(
    expect.objectContaining({
      fullJitter: connectionDependencies.fullJitter,
      coercer: connectionDependencies.coercer,
      escape: connectionDependencies.escape,
      escapeId: connectionDependencies.escapeId,
    })
  )
})

test("rds data service client assigned to adapter's pool", async () => {
  await connect(pool, connectionDependencies, config)

  expect(pool.rdsDataService).toBeInstanceOf(RDSDataService)
})

test("executeStatement bound to adapter's pool", async () => {
  await connect(pool, connectionDependencies, config)

  expect(pool.executeStatement).toBeDefined()
  if (pool.executeStatement) {
    await pool.executeStatement('test')
    expect(connectionDependencies.executeStatement).toHaveBeenCalledWith(
      pool,
      'test'
    )
  }
})
