const create = async (
  pool,
  { region, tableName, readCapacityUnits, writeCapacityUnits }
) => {
  const { createAdapter, setupAutoScaling } = pool

  const dynamoAdapter = createAdapter({
    tableName,
    readCapacityUnits,
    writeCapacityUnits,
    skipInit: true
  })
  await dynamoAdapter.init()

  await setupAutoScaling(pool, region, tableName)
}

export default create
