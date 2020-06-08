/* eslint-disable import/no-extraneous-dependencies */
import RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { mocked } from 'ts-jest/utils'
/* eslint-enable import/no-extraneous-dependencies */
import { AdapterPool, AdapterSpecific } from '../src/types'
import connect from '../src/connect'

jest.mock('../src/js/get-log')

let rdsRelatedConfig: any
let pool: AdapterPool
let specific: AdapterSpecific

const mRDSDataService = mocked(RDSDataService)

beforeEach(() => {
  rdsRelatedConfig = {
    rdsRelatedOption: 'rds-option'
  }
  pool = {
    config: {
      dbClusterOrInstanceArn: 'instance-arn',
      awsSecretStoreArn: 'secret-store-arn',
      eventsTableName: 'table',
      databaseName: 'database',
      secretsTableName: 'secrets-table',
      ...rdsRelatedConfig
    }
  }
  specific = {
    coercer: jest.fn(),
    escape: jest.fn(),
    escapeId: jest.fn(),
    executeStatement: jest.fn(),
    fullJitter: jest.fn(),
    RDSDataService
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
      dbClusterOrInstanceArn: 'instance-arn',
      awsSecretStoreArn: 'secret-store-arn',
      eventsTableName: 'table',
      databaseName: 'database',
      secretsTableName: 'secrets-table'
    })
  )
  expect(pool).toEqual(
    expect.objectContaining({
      fullJitter: specific.fullJitter,
      coercer: specific.coercer,
      escape: specific.escape,
      escapeId: specific.escapeId
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
      escapeId: specific.escapeId
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
