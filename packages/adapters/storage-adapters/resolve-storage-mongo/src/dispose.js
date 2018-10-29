const dispose = async (pool, options) => {
  if (options.dropEvents) {
    await pool.collection.deleteMany({})
    await pool.collection.dropIndexes()
  }

  await pool.client.close()
}

export default dispose
