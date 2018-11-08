const connect = async (pool, MongoClient) => {
  const { url, collectionName, ...connectionOptions } = pool.config

  const client = await MongoClient.connect(
    url,
    { ...connectionOptions, useNewUrlParser: true }
  )
  const database = await client.db()
  const collection = await database.collection(collectionName)

  Object.assign(pool, {
    client,
    database,
    collection
  })
}

export default connect
