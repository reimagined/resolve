const bindWithConnection = (...bindArgs) => async (...funcArgs) => {
  const [pool, func, readModelName] = bindArgs
  if (!pool.connectPromise) {
    pool.connectPromise = pool.connect(
      pool.adapterContext,
      {
        ...pool.options,
        checkStoredTableSchema: pool.checkTableSchema,
        metaName: pool.metaName,
        tablePrefix: pool.tablePrefix
      }
    )
  }
  await pool.connectPromise

  if (bindArgs.length === 3) {
    return await func(pool.adapterContext, readModelName, ...funcArgs)
  } else {
    return await func(pool.adapterContext, ...funcArgs)
  }
}

export default bindWithConnection
