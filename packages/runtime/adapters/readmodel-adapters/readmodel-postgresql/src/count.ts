import type { CurrentStoreApi } from './types'

const count: CurrentStoreApi['count'] = async (
  pool,
  readModelName,
  tableName,
  searchExpression
) => {
  const sqlQuery = pool.makeSqlQuery(
    pool,
    readModelName,
    'count',
    tableName,
    searchExpression
  )
  const rows = (await pool.inlineLedgerRunQuery(sqlQuery)) as Array<{
    Count: number
  }>

  if (
    Array.isArray(rows) &&
    rows.length > 0 &&
    rows[0] != null &&
    Number.isInteger(+rows[0].Count)
  ) {
    return +rows[0].Count
  }

  return 0
}

export default count
