import type { CurrentStoreApi } from './types'

const insert: CurrentStoreApi["insert"] = async (
  pool,
  readModelName,
  tableName,
  document
) => {
  const { executeStatement, escapeId, escapeStr, tablePrefix, schemaName } = pool
  await executeStatement(
    pool,
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
