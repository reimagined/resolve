import AWS from 'aws-sdk'
import debugLevels from '@resolve-js/debug-levels'
import createEventstoreAdapter, {
  create,
  destroy,
} from '@resolve-js/eventstore-postgresql-serverless'

const logger = debugLevels('resolve:postgresql-polling-events')

AWS.config.update({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
  httpOptions: { timeout: 300000 },
})

jest.setTimeout(20000000)

describe.skip('@resolve-js/eventstore-mysql-serverless', () => {
  beforeAll.skip(async () => {
    logger.warn('create start')
    const rdsDataApi = new AWS.RDSDataService({
      region: process.env.AWS_REGION,
    })
    try {
      await rdsDataApi
        .executeStatement({
          awsSecretStoreAdminArn: process.env.AWS_SECRET_STORE_ADMIN_ARN,
          dbClusterOrInstanceArn: process.env.AWS_POSTGRES_CLUSTER_ARN,
          database: 'postgres',
          continueAfterTimeout: false,
          includeResultMetadata: true,
          sql: `SELECT pg_terminate_backend(pid)
          FROM pg_stat_activity
          WHERE usename='${process.env.AWS_POSTGRES_USER_NAME}';`,
        })
        .promise()
    } catch (error) {}

    await create({
      region: process.env.AWS_REGION,
      awsSecretStoreAdminArn: process.env.AWS_SECRET_STORE_ADMIN_ARN,
      dbClusterOrInstanceArn: process.env.AWS_POSTGRES_CLUSTER_ARN,
      databaseName: process.env.AWS_POSTGRES_DATABASE_NAME,
      eventsTableName: process.env.AWS_POSTGRES_TABLE_NAME,
      userLogin: process.env.AWS_POSTGRES_USER_NAME,
      userPassword: process.env.AWS_POSTGRES_PASSWORD,
    })
    logger.warn('create end')
  })

  afterAll.skip(async () => {
    logger.warn('destroy start')
    await destroy({
      region: 'us-east-1',
      awsSecretStoreAdminArn: process.env.AWS_SECRET_STORE_ADMIN_ARN,
      dbClusterOrInstanceArn: process.env.AWS_POSTGRES_CLUSTER_ARN,
      databaseName: process.env.AWS_POSTGRES_DATABASE_NAME,
      userLogin: process.env.AWS_POSTGRES_USER_NAME,
    })
    logger.warn('destroy end')
  })

  let eventstoreAdapter = null

  beforeEach(async () => {
    eventstoreAdapter = createEventstoreAdapter({
      region: process.env.AWS_REGION,
      databaseName: process.env.AWS_POSTGRES_DATABASE_NAME,
      eventsTableName: process.env.AWS_POSTGRES_TABLE_NAME,
      awsSecretStoreArn: process.env.AWS_SECRET_STORE_ARN,
      dbClusterOrInstanceArn: process.env.AWS_POSTGRES_CLUSTER_ARN,
    })

    logger.warn('drop eventstore start')

    try {
      await eventstoreAdapter.drop()
    } catch (error) {}

    logger.warn('drop eventstore end')

    logger.warn('init eventstore start')

    try {
      await eventstoreAdapter.init()
    } catch (error) {}

    logger.warn('drop eventstore end')
  })

  afterEach(async () => {
    const rdsDataApi = new AWS.RDSDataService({ region: 'us-east-1' })
    try {
      await rdsDataApi
        .executeStatement({
          awsSecretStoreAdminArn: process.env.AWS_SECRET_STORE_ADMIN_ARN,
          dbClusterOrInstanceArn: process.env.AWS_POSTGRES_CLUSTER_ARN,
          database: 'postgres',
          continueAfterTimeout: false,
          includeResultMetadata: true,
          sql: `SELECT pg_terminate_backend(pid)
          FROM pg_stat_activity
          WHERE usename='${process.env.AWS_POSTGRES_USER_NAME}';`,
        })
        .promise()
    } catch (error) {}
  })

  test('"saveEvent" should save an event with empty payload', async () => {
    const eventCount = 1000

    let leftEvent = eventCount
    const promises = []

    const eventWorker = async (ei) => {
      logger.warn('save start', ei)
      await eventstoreAdapter.saveEvent({
        type: 'TYPE😂',
        aggregateId: `🐱-${ei}`,
        aggregateVersion: ei,
        timestamp: ei,
        payload: { aggregate: true },
      })
      leftEvent--
      logger.warn('save end', ei, 'left', leftEvent)
    }

    for (let eventIndex = 1; eventIndex <= eventCount; eventIndex++) {
      promises.push(eventWorker(eventIndex))
    }
    await Promise.all(promises)

    const aggregateMap = new Map()

    let events = []
    let marker = null
    while (true) {
      logger.warn('Marker is', marker)

      const currentEvents = []
      await eventstoreAdapter.loadEvents(
        { cursor: marker, limit: 67 },
        (event) => {
          currentEvents.push(event)
          events.push(event)

          aggregateMap.set(
            event.aggregateId,
            ~~aggregateMap.get(event.aggregateId) + 1
          )
        }
      )

      marker = eventstoreAdapter.getNextCursor(marker, currentEvents)

      if (currentEvents.length === 0) {
        break
      }
    }

    for (const [aggregateK, aggregateV] of aggregateMap.entries()) {
      if (aggregateV !== 1) {
        logger.warn('aggregate', aggregateK, aggregateV)
      }
    }

    logger.warn(events.length, eventCount)
  })
})
