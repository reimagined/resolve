const dispose = async (pool, options) => {
  if (options.dropEvents) {
    await pool.promiseInvoke(pool.db.remove.bind(pool.db), {}, { multi: true })
    await pool.db.clearIndexes()
  }
}

export default dispose
