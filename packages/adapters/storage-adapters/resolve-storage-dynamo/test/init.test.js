import sinon from 'sinon'

import init from '../src/init'
import { apiVersion, globalPartitionKey, rangedIndex } from '../src/constants'

describe('method "init"', () => {
  test('should create table and init pool', async () => {
    const database = {
      name: 'database',
      createTable: sinon
        .stub()
        .returns({ promise: sinon.stub().returns(Promise.resolve()) })
    }
    const documentClient = { name: 'documentClient' }
    const DynamoDB = sinon.stub().returns(database)
    DynamoDB.DocumentClient = sinon.stub().returns(documentClient)

    const pool = {
      config: {
        region: 'region',
        endpoint: 'endpoint',
        accessKeyId: 'accessKeyId',
        secretAccessKey: 'secretAccessKey',
        tableName: 'tableName',
        readCapacityUnits: 1,
        writeCapacityUnits: 1
      }
    }
    const helpers = {}

    const checkTableExists = sinon.stub()
    checkTableExists.onCall(0).returns(Promise.resolve(false))
    checkTableExists.onCall(1).returns(Promise.resolve(false))
    checkTableExists.returns(Promise.resolve(true))

    await init({ DynamoDB, checkTableExists, ...helpers }, pool)

    sinon.assert.calledWith(DynamoDB, {
      region: pool.config.region,
      endpoint: pool.config.endpoint,
      accessKeyId: pool.config.accessKeyId,
      secretAccessKey: pool.config.secretAccessKey,
      apiVersion
    })
    sinon.assert.calledWith(DynamoDB.DocumentClient, {
      region: pool.config.region,
      endpoint: pool.config.endpoint,
      accessKeyId: pool.config.accessKeyId,
      secretAccessKey: pool.config.secretAccessKey,
      apiVersion
    })
    sinon.assert.calledWith(checkTableExists, database, pool.config.tableName)
    sinon.assert.calledWith(database.createTable, {
      TableName: pool.config.tableName,
      ProvisionedThroughput: {
        ReadCapacityUnits: pool.config.readCapacityUnits,
        WriteCapacityUnits: pool.config.writeCapacityUnits
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
            ReadCapacityUnits: pool.config.readCapacityUnits,
            WriteCapacityUnits: pool.config.writeCapacityUnits
          }
        }
      ]
    })
  })
})
