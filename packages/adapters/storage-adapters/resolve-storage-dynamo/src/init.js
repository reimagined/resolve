import { globalPartitionKey, rangedIndex } from './constants'

const init = async ({
  tableName,
  billingMode = 'PAY_PER_REQUEST',
  readCapacityUnits,
  writeCapacityUnits,
  database,
  checkTableExists
}) => {
  if (await checkTableExists(database, tableName)) {
    return
  }

  const params = {
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
  }

  if (billingMode === 'PROVISIONED') {
    params.ProvisionedThroughput = {
      ReadCapacityUnits: readCapacityUnits,
      WriteCapacityUnits: writeCapacityUnits
    }
    params.GlobalSecondaryIndexes.forEach(globalSecondaryIndexes => {
      globalSecondaryIndexes.ProvisionedThroughput = {
        ReadCapacityUnits: readCapacityUnits,
        WriteCapacityUnits: writeCapacityUnits
      }
    })
  }

  await database
    .createTable({
      TableName: tableName,
      BillingMode: billingMode,
      ...params
    })
    .promise()

  while (!(await checkTableExists(database, tableName))) {}
}

export default init
