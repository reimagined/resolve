const drop = async ({ database, tableName }) => {
  await database.deleteTable({
    TableName: tableName
  })
}

export default drop
