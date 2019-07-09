const drop = async ({ database, tableName }) => {
  await database
    .deleteTable({
      TableName: tableName
    })
    .promise()
}

export default drop
