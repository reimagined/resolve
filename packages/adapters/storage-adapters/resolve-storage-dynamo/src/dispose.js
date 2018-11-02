const dispose = async (pool, options) => {
  const {
    database,
    config: { tableName }
  } = pool
  const { dropEvents } = options

  if (dropEvents) {
    await database.deleteTable({
      TableName: tableName
    })
  }
}

export default dispose
