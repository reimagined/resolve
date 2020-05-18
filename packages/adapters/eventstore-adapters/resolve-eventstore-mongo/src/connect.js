const connect = async (pool, { MongoClient }) => {
  const { url, collectionName, ...connectionOptions } = pool.config

  const client = await MongoClient.connect(url, {
    ...connectionOptions,
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  const database = await client.db()

  Object.assign(pool, {
    collectionName,
    client,
    database
  })
}

export default connect
