const destroy = async (
  { createAdapter },
  { tableName, readCapacityUnits, writeCapacityUnits }
) => {
  const dynamoAdapter = createAdapter({
    tableName,
    readCapacityUnits,
    writeCapacityUnits,
    skipInit: true
  })
  await dynamoAdapter.dispose({ dropEvents: true }) // delete table
}

export default destroy
