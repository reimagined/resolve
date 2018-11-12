const checkTableExists = async (database, tableName) => {
  try {
    const tableInfo = await database
      .describeTable({ TableName: tableName })
      .promise()

    const tableStatus = tableInfo.Table.TableStatus

    if (tableStatus === 'ACTIVE') {
      return true
    }

    return await checkTableExists(database, tableName)
  } catch (error) {}

  return false
}

export default checkTableExists
