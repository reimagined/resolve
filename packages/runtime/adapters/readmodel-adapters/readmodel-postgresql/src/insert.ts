import type { CurrentStoreApi } from './types'

const insert: CurrentStoreApi['insert'] = async (
  pool,
  readModelName,
  tableName,
  document
) => {
  const sqlQuery = pool.makeSqlQuery(
    pool,
    readModelName,
    'insert',
    tableName,
    document
  )
  await pool.inlineLedgerRunQuery(sqlQuery)
}

export default insert
