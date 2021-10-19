import type { CurrentStoreApi } from './types'

const del: CurrentStoreApi['delete'] = async (
  pool,
  readModelName,
  tableName,
  searchExpression
) => {
  const sqlQuery = pool.makeSqlQuery(
    pool,
    readModelName,
    'delete',
    tableName,
    searchExpression
  )

  await pool.inlineLedgerRunQuery(sqlQuery)
}

export default del
