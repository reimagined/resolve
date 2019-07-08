const dropReadModel = async (pool, readModelName) => {
  const { databasePromise, listReadModelTables } = pool
  const database = await databasePromise

  for (const tableName of await listReadModelTables(pool, readModelName)) {
    await database.dropCollection(tableName)
  }
}

export default dropReadModel
