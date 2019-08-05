import debugLevels from 'resolve-debug-levels'
import { globalPartitionKey, rangedIndex } from './constants'

const log = debugLevels('resolve:resolve-storage-dynamo:init')

const init = async ({
  tableName,
  billingMode = 'PAY_PER_REQUEST',
  readCapacityUnits,
  writeCapacityUnits,
  database,
  checkTableExists,
  lazyWaitForCreate = false
}) => {
  log.debug(`init started${lazyWaitForCreate ? ' (mode:"lazy")' : ''}`)

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

  const waitForCreate = async () => {
    log.debug('wait for create started')
    while (!(await checkTableExists(database, tableName))) {}
    log.debug('wait for create successful')
  }

  if (lazyWaitForCreate) {
    log.debug('init successful (mode:"lazy")')
    return waitForCreate
  } else {
    await waitForCreate()
    log.debug('init successful')
  }
}

export default init
