const connect = async (pool, { NeDB, promiseInvoke }) => {
  const { pathToFile, ...initOptions } = pool.config

  const database = new NeDB({
    ...(pathToFile != null ? { filename: pathToFile } : { inMemoryOnly: true }),
    ...initOptions
  })

  Object.assign(pool, {
    promiseInvoke,
    database
  })
}

export default connect
