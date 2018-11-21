import { apiVersion } from './constants'

const connect = async (pool, { DynamoDB, checkTableExists, ...helpers }) => {
  const {
    tableName,
    readCapacityUnits = 5,
    writeCapacityUnits = 5,
    ...connectionOptions
  } = pool.config

  const options = {
    ...connectionOptions,
    apiVersion
  }

  const database = new DynamoDB(options)
  const documentClient = new DynamoDB.DocumentClient(options)

  Object.assign(pool, helpers, {
    database,
    documentClient,
    checkTableExists,
    tableName,
    readCapacityUnits,
    writeCapacityUnits
  })
}

export default connect
