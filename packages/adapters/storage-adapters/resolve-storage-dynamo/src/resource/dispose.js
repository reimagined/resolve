const dispose = async (
  pool,
  { tableName, newTableName, readCapacityUnits, writeCapacityUnits }
) => {
  const { createAdapter, destroy } = pool

  await destroy(pool, { tableName, readCapacityUnits, writeCapacityUnits })

  const dynamoAdapter = createAdapter({
    tableName: newTableName,
    readCapacityUnits,
    writeCapacityUnits,
    skipInit: true
  })
  await dynamoAdapter.init()
}

export default dispose
