import type { CurrentStoreApi, MarshalledRowLike, JsonMap } from './types'

const find: CurrentStoreApi['find'] = async (
  pool,
  readModelName,
  tableName,
  searchExpression,
  fieldList,
  sort,
  skip,
  limit
) => {
  const sqlQuery = pool.makeSqlQuery(
    pool,
    readModelName,
    'find',
    tableName,
    searchExpression,
    fieldList,
    sort,
    skip,
    limit
  )

  const inputRows = (await pool.inlineLedgerRunQuery(
    sqlQuery
  )) as Array<MarshalledRowLike>

  const rows: Array<JsonMap> = []

  for (let idx = 0; idx < inputRows.length; idx++) {
    rows[idx] = pool.convertResultRow(inputRows[idx], fieldList)
  }

  return rows
}

export default find
