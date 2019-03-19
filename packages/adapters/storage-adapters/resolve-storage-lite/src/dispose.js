const dispose = async ({ database }, { dropEvents }) => {
  if (dropEvents) {
    await database.exec(`DELETE FROM ${escapeId(tableName)}`)
  }

  await database.close()
}

export default dispose
