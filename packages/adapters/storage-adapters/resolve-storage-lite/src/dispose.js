const dispose = async ({ database, tableName, escapeId }, { dropEvents }) => {
  if (dropEvents) {
    await database.exec(`DELETE FROM ${escapeId(tableName)}`)
  }

  await database.close()
}

export default dispose
