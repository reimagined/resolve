const dispose = async ({ database, config: { tableName } }, { dropEvents }) => {
  if (dropEvents) {
    await database.deleteTable({
      TableName: tableName
    })
  }
}

export default dispose
