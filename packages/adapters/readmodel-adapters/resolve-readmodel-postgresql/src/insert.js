const insert = async (
  { runQuery, escapeId, escapeStr, tablePrefix, schemaName },
  readModelName,
  tableName,
  document
) => {
  await runQuery(
    `INSERT INTO ${escapeId(schemaName)}.${escapeId(
      `${tablePrefix}${tableName}`
    )}(${Object.keys(document)
      .map((key) => escapeId(key))
      .join(', ')})
      VALUES(${Object.keys(document)
        .map(
          (key) => `CAST(${escapeStr(JSON.stringify(document[key]))} AS JSONB)`
        )
        .join(', ')});
    `
  )
}

export default insert
