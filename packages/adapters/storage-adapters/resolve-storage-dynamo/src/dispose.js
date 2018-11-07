const dispose = async ({ database, tableName }, { dropEvents }) => {
  if (dropEvents) {
    await database.deleteTable({
      TableName: tableName
    })
  }
}

export default dispose
