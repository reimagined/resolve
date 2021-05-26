import type { CurrentStoreApi } from './types'

const insert: CurrentStoreApi['insert'] = async (
  pool,
  readModelName,
  tableName,
  document
) => {
  const {
    inlineLedgerExecuteStatement,
    escapeId,
    escapeStr,
    tablePrefix,
    schemaName,
  } = pool
  await inlineLedgerExecuteStatement(
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
    `,
    inlineLedgerExecuteStatement.SHARED_TRANSACTION_ID
  )
}

export default insert
