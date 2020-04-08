const connect = async pool => {
  const { url, bucketSize = 100, ...connectionOptions } = pool.config
  pool.bucketSize = bucketSize
  pool.counters = new Map()

  pool.client = await pool.MongoClient.connect(url, {
    ...connectionOptions,
    useNewUrlParser: true
  })
}

export default connect
