const create = async (
  pool,
  { tableName, readCapacityUnits, writeCapacityUnits }
) => {
  const { createAdapter, setupAutoScaling } = pool

  const dynamoAdapter = createAdapter({
    tableName,
    readCapacityUnits,
    writeCapacityUnits,
    skipInit: true
  })
  await dynamoAdapter.init()

  await setupAutoScaling(pool, tableName)
}

export default create
