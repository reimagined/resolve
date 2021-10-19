import type { CurrentStoreApi, MarshalledRowLike } from './types'

const findOne: CurrentStoreApi['findOne'] = async (
  pool,
  readModelName,
  tableName,
  searchExpression,
  fieldList
) => {
  const sqlQuery = pool.makeSqlQuery(
    pool,
    readModelName,
    'findOne',
    tableName,
    searchExpression,
    fieldList
  )

  const rows = (await pool.inlineLedgerRunQuery(
    sqlQuery
  )) as Array<MarshalledRowLike>

  if (Array.isArray(rows) && rows.length > 0) {
    return pool.convertResultRow(rows[0], fieldList)
  }

  return null
}

export default findOne
