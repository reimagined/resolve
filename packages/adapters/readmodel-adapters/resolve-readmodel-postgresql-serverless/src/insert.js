const insert = async (
  { executeStatement, escapeId, escape, tablePrefix, schemaName },
  readModelName,
  tableName,
  document
) => {
  await executeStatement(
    `INSERT INTO ${escapeId(schemaName)}.${escapeId(
      `${tablePrefix}${tableName}`
    )}(${Object.keys(document)
      .map(key => escapeId(key))
      .join(', ')})
      VALUES(${Object.keys(document)
        .map(key => `CAST(${escape(JSON.stringify(document[key]))} AS JSONB)`)
        .join(', ')});
    `
  )
}

export default insert
