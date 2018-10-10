const init = async (NeDB, pool) => {
  const { pathToFile, ...initOptions } = pool.config

  const db = new NeDB({
    ...(pathToFile != null ? { filename: pathToFile } : { inMemoryOnly: true }),
    ...initOptions
  })

  pool.promiseInvoke = async (func, ...args) =>
    await new Promise((resolve, reject) =>
      func(
        ...args,
        (error, result) => (error ? reject(error) : resolve(result))
      )
    )

  await pool.promiseInvoke(db.loadDatabase.bind(db))

  await pool.promiseInvoke(db.ensureIndex.bind(db), {
    fieldName: 'aggregateIdAndVersion',
    unique: true,
    sparse: true
  })

  await pool.promiseInvoke(db.ensureIndex.bind(db), {
    fieldName: 'aggregateId'
  })

  await pool.promiseInvoke(db.ensureIndex.bind(db), {
    fieldName: 'aggregateVersion'
  })

  await pool.promiseInvoke(db.ensureIndex.bind(db), { fieldName: 'type' })

  pool.db = db
}

export default init
