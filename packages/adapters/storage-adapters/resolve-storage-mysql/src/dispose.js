const dispose = async ({ tableName, connection, escapeId }, { dropEvents }) => {
  if (dropEvents) {
    await connection.execute(`
      DELETE FROM ${escapeId(tableName)}
    `)
  }

  await connection.end()
}

export default dispose
