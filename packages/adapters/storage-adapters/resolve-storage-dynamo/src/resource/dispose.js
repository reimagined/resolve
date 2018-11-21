const dispose = async (pool, { newTableName, ...options }) => {
  const { createAdapter, destroy } = pool

  await destroy(pool, options)

  const dynamoAdapter = createAdapter({
    ...options,
    tableName: newTableName,
    skipInit: true
  })
  await dynamoAdapter.init()
}

export default dispose
