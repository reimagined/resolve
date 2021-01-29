const insert = async (
  { runQuery, escapeId, escapeStr, tablePrefix },
  readModelName,
  tableName,
  document
) => {
  await runQuery(
    `INSERT INTO ${escapeId(`${tablePrefix}${tableName}`)}(${Object.keys(
      document
    )
      .map((key) => escapeId(key))
      .join(', ')})
      VALUES(${Object.keys(document)
        .map(
          (key) =>
            `json(CAST(${escapeStr(JSON.stringify(document[key]))} AS BLOB))`
        )
        .join(', ')})
    `
  )
}

export default insert
