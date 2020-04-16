const DEFAULT_BUCKET_SIZE = 100
const DEFAULT_TABLE_NAME = '__ResolveSnapshots__'

const connect = async pool => {
  const { bucketSize, tableName, ...connectionOptions } = pool.config
  pool.connection = await pool.MySQL.createConnection(connectionOptions)

  pool.bucketSize = bucketSize
  if (!Number.isInteger(pool.bucketSize) || pool.bucketSize < 1) {
    pool.bucketSize = DEFAULT_BUCKET_SIZE
  }

  pool.tableName = tableName
  if (pool.tableName == null || pool.tableName.constructor !== String) {
    pool.tableName = DEFAULT_TABLE_NAME
  }

  pool.counters = new Map()
}

export default connect
