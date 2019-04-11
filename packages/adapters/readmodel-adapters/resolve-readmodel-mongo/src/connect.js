const setupConnection = async pool => {
  pool.databasePromise = new Promise((resolve, reject) => {
    pool.MongoClient.connect(
      pool.url,
      {
        ...pool.connectionOptions,
        useNewUrlParser: true,
        autoReconnect: false
      },
      (error, client) => {
        if (error != null) {
          return reject(error)
        }
        try {
          pool.connection = client
          return resolve(client.db())
        } catch (error) {
          return reject(error)
        }
      }
    )
  })

  try {
    await pool.databasePromise
  } catch (error) {
    if (error.code === 'CONNECTION_LOST') {
      Promise.resolve().then(setupConnection.bind(null, pool))
      return
    }

    pool.lastMongodbError = error
    // eslint-disable-next-line no-console
    console.warn('MongoDB error: ', error)
  }
}

const getCollection = async (
  { databasePromise, tablePrefix },
  readModelName,
  tableName,
  forceCreate = false
) => {
  const database = await databasePromise
  const collection = forceCreate
    ? await database.createCollection(`${tablePrefix}${tableName}`)
    : await database.collection(`${tablePrefix}${tableName}`)

  return collection
}

const connect = async (imports, pool, options) => {
  let { url, tablePrefix, ...connectionOptions } = options
  if (
    tablePrefix == null ||
    (tablePrefix != null && tablePrefix.constructor !== String)
  ) {
    tablePrefix = ''
  }

  const rootId = imports.ObjectID.createFromHexString(
    '5265736f6c7665526f6f7400'
  )

  Object.assign(pool, {
    getCollection: getCollection.bind(null, pool),
    connectionOptions,
    url,
    tablePrefix,
    rootId,
    ...imports
  })

  await setupConnection(pool)
}

export default connect
