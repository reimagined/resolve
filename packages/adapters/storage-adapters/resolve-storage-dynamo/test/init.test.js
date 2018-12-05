import sinon from 'sinon'

import init from '../src/init'
import { globalPartitionKey, rangedIndex } from '../src/constants'

describe('method "init"', () => {
  test('should create table [PROVISIONED]', async () => {
    const database = {
      name: 'database',
      createTable: sinon
        .stub()
        .returns({ promise: sinon.stub().returns(Promise.resolve()) })
    }

    const checkTableExists = sinon.stub()
    checkTableExists.onCall(0).returns(Promise.resolve(false))
    checkTableExists.onCall(1).returns(Promise.resolve(false))
    checkTableExists.returns(Promise.resolve(true))

    const pool = {
      tableName: 'tableName',
      billingMode: 'PROVISIONED',
      readCapacityUnits: 1,
      writeCapacityUnits: 1,
      database,
      checkTableExists
    }

    await init(pool)

    sinon.assert.calledWith(checkTableExists, database, pool.tableName)
    sinon.assert.calledWith(database.createTable, {
      TableName: pool.tableName,
      BillingMode: 'PROVISIONED',
      ProvisionedThroughput: {
        ReadCapacityUnits: pool.readCapacityUnits,
        WriteCapacityUnits: pool.writeCapacityUnits
      },
      AttributeDefinitions: [
        {
          AttributeName: 'aggregateId',
          AttributeType: 'S'
        },
        {
          AttributeName: 'aggregateVersion',
          AttributeType: 'N'
        },
        {
          AttributeName: globalPartitionKey,
          AttributeType: 'S'
        },
        {
          AttributeName: 'timestamp',
          AttributeType: 'N'
        }
      ],
      KeySchema: [
        {
          AttributeName: 'aggregateId',
          KeyType: 'HASH'
        },
        {
          AttributeName: 'aggregateVersion',
          KeyType: 'RANGE'
        }
      ],
      StreamSpecification: {
        StreamEnabled: true,
        StreamViewType: 'NEW_IMAGE'
      },
      GlobalSecondaryIndexes: [
        {
          IndexName: rangedIndex,
          KeySchema: [
            {
              AttributeName: globalPartitionKey,
              KeyType: 'HASH'
            },
            {
              AttributeName: 'timestamp',
              KeyType: 'RANGE'
            }
          ],
          Projection: {
            ProjectionType: 'ALL'
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: pool.readCapacityUnits,
            WriteCapacityUnits: pool.writeCapacityUnits
          }
        }
      ]
    })
  })

  test('should create table [PAY_PER_REQUEST]', async () => {
    const database = {
      name: 'database',
      createTable: sinon
        .stub()
        .returns({ promise: sinon.stub().returns(Promise.resolve()) })
    }

    const checkTableExists = sinon.stub()
    checkTableExists.onCall(0).returns(Promise.resolve(false))
    checkTableExists.onCall(1).returns(Promise.resolve(false))
    checkTableExists.returns(Promise.resolve(true))

    const pool = {
      tableName: 'tableName',
      database,
      checkTableExists
    }

    await init(pool)

    sinon.assert.calledWith(checkTableExists, database, pool.tableName)
    sinon.assert.calledWith(database.createTable, {
      TableName: pool.tableName,
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        {
          AttributeName: 'aggregateId',
          AttributeType: 'S'
        },
        {
          AttributeName: 'aggregateVersion',
          AttributeType: 'N'
        },
        {
          AttributeName: globalPartitionKey,
          AttributeType: 'S'
        },
        {
          AttributeName: 'timestamp',
          AttributeType: 'N'
        }
      ],
      KeySchema: [
        {
          AttributeName: 'aggregateId',
          KeyType: 'HASH'
        },
        {
          AttributeName: 'aggregateVersion',
          KeyType: 'RANGE'
        }
      ],
      StreamSpecification: {
        StreamEnabled: true,
        StreamViewType: 'NEW_IMAGE'
      },
      GlobalSecondaryIndexes: [
        {
          IndexName: rangedIndex,
          KeySchema: [
            {
              AttributeName: globalPartitionKey,
              KeyType: 'HASH'
            },
            {
              AttributeName: 'timestamp',
              KeyType: 'RANGE'
            }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        }
      ]
    })
  })

  test('should skip create table', async () => {
    const database = {
      name: 'database',
      createTable: sinon
        .stub()
        .returns({ promise: sinon.stub().returns(Promise.resolve()) })
    }

    const checkTableExists = sinon.stub()
    checkTableExists.returns(Promise.resolve(true))

    const pool = {
      tableName: 'tableName',
      database,
      checkTableExists
    }

    await init(pool)

    sinon.assert.calledWith(checkTableExists, database, pool.tableName)

    sinon.assert.callCount(database.createTable, 0)
  })
})
