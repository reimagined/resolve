const drop = async ({
  databaseName,
  tableName,
  executeStatement,
  escapeId
}) => {
  await executeStatement(
    [
      `DROP TABLE ${escapeId(databaseName)}.${escapeId(tableName)}; `,
      `DROP TABLE ${escapeId(databaseName)}.${escapeId(
        `${tableName}-sequence`
      )}; `,
      `DROP TABLE IF EXISTS ${escapeId(databaseName)}.${escapeId(
        `${tableName}-freeze`
      )}; `
    ].join('')
  )
}

export default drop
