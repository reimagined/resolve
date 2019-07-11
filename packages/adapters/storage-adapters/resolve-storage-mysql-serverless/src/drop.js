const drop = async ({ tableName, escapeId, executeSql }) => {
  await executeSql(`
    DELETE FROM ${escapeId(tableName)};
  `)
}

export default drop
