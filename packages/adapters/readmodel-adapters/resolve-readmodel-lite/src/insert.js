const insert = async (
  { runQuery, escapeId, escape, tablePrefix },
  readModelName,
  tableName,
  document
) => {
  await runQuery(
    `INSERT INTO ${escapeId(`${tablePrefix}${tableName}`)}(${Object.keys(
      document
    )
      .map(key => escapeId(key))
      .join(', ')})
      VALUES(${Object.keys(document)
        .map(
          key => `json(CAST(${escape(JSON.stringify(document[key]))} AS BLOB))`
        )
        .join(', ')})
    `
  )
}

export default insert
