import type { CurrentStoreApi } from './types'

const update: CurrentStoreApi['update'] = async (
  pool,
  readModelName,
  tableName,
  searchExpression,
  updateExpression,
  options
) => {
  const sqlQuery = pool.makeSqlQuery(
    pool,
    readModelName,
    'update',
    tableName,
    searchExpression,
    updateExpression,
    options
  )

  await pool.inlineLedgerRunQuery(sqlQuery)
}

export default update
