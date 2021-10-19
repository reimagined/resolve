import type { CurrentStoreApi } from './types'

const defineTable: CurrentStoreApi['defineTable'] = async (
  pool,
  readModelName,
  tableName,
  tableDescription
) => {
  const sqlQuery = pool.makeSqlQuery(
    pool,
    readModelName,
    'defineTable',
    tableName,
    tableDescription
  )

  await pool.inlineLedgerRunQuery(sqlQuery)
}

export default defineTable
