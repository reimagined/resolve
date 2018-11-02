import { apiVersion, globalPartitionKey, rangedIndex } from './constants'

const init = async ({ DynamoDB, checkTableExists, ...helpers }, pool) => {
  const {
    region,
    endpoint,
    accessKeyId,
    secretAccessKey,
    tableName,
    readCapacityUnits = 5,
    writeCapacityUnits = 5
  } = pool.config

  const options = {
    region,
    endpoint,
    accessKeyId,
    secretAccessKey,
    apiVersion
  }

  const database = new DynamoDB(options)
  const documentClient = new DynamoDB.DocumentClient(options)

  Object.assign(pool, helpers, {
    database,
    documentClient,
    checkTableExists
  })

  if (await checkTableExists(database, tableName)) {
    return
  }

  await database
    .createTable({
      TableName: tableName,
      ProvisionedThroughput: {
        ReadCapacityUnits: readCapacityUnits,
        WriteCapacityUnits: writeCapacityUnits
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
            ReadCapacityUnits: readCapacityUnits,
            WriteCapacityUnits: writeCapacityUnits
          }
        }
      ]
    })
    .promise()

  while (!(await checkTableExists(database, tableName))) {}
}

export default init
