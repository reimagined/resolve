import type { CurrentStoreApi, MarshalledRowLike, JsonMap } from './types'

const MAX_LIMIT_VALUE = 0x0fffffff | 0
const LIMIT_REGEX = /Database returned more than the allowed response size limit/i
const RETRY_LIMIT = Symbol('RETRY_LIMIT')

const retrieveRows = async (
  pool: Parameters<CurrentStoreApi['find']>[0],
  fieldList: Parameters<CurrentStoreApi['find']>[4],
  query: string,
  currentSkip: number,
  currentLimit: number
): ReturnType<CurrentStoreApi['find']> => {
  try {
    const { inlineLedgerExecuteStatement, convertResultRow } = pool

    const inputRows = (await inlineLedgerExecuteStatement(
      pool,
      `${query} OFFSET ${currentSkip} LIMIT ${currentLimit}`,
      inlineLedgerExecuteStatement.SHARED_TRANSACTION_ID
    )) as Array<MarshalledRowLike>

    const rows: Array<JsonMap> = []
    for (let idx = 0; idx < inputRows.length; idx++) {
      rows[idx] = convertResultRow(inputRows[idx], fieldList)
    }

    return rows
  } catch (error) {
    if (
      error == null ||
      !(
        LIMIT_REGEX.test(error.message) ||
        LIMIT_REGEX.test(error.stack) ||
        LIMIT_REGEX.test(error.code)
      )
    ) {
      throw error
    }
    throw RETRY_LIMIT
  }
}

const makeRowsLimitError = () =>
  new Error('Database returned more than the allowed response size limit')

const find: CurrentStoreApi['find'] = async (
  pool,
  readModelName,
  tableName,
  searchExpression,
  fieldList,
  sort,
  inputSkip,
  inputLimit
) => {
  const {
    searchToWhereExpression,
    makeNestedPath,
    inlineLedgerExecuteStatement,
    escapeId,
    escapeStr,
    tablePrefix,
    schemaName,
  } = pool

  const orderExpression =
    sort && Object.keys(sort).length > 0
      ? 'ORDER BY ' +
        Object.keys(sort)
          .map((fieldName) => {
            const [baseName, ...nestedPath] = fieldName.split('.')
            const provisionedName =
              nestedPath.length === 0
                ? escapeId(baseName)
                : `${escapeId(baseName)}->'${makeNestedPath(nestedPath)}'`
            return sort[fieldName] > 0
              ? `${provisionedName} ASC`
              : `${provisionedName} DESC`
          })
          .join(', ')
      : ''

  const searchExpr = searchToWhereExpression(
    searchExpression,
    escapeId,
    escapeStr,
    makeNestedPath
  )

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  const query = `SELECT * FROM ${escapeId(schemaName)}.${escapeId(
    `${tablePrefix}${tableName}`
  )}
  ${inlineSearchExpr}
  ${orderExpression}
  `

  const skip = isFinite(+(inputSkip as number)) ? +(inputSkip as number) : 0
  let limit = isFinite(+(inputLimit as number))
    ? +(inputLimit as number)
    : MAX_LIMIT_VALUE

  try {
    return await retrieveRows(pool, fieldList, query, skip, limit)
  } catch (error) {
    if (error !== RETRY_LIMIT) {
      throw error
    }
  }

  try {
    limit = ((await inlineLedgerExecuteStatement(
      pool,
      `WITH "CTE" AS (${query} OFFSET ${skip})
      SELECT Count("CTE".*) AS "Count" FROM "CTE"
      `,
      inlineLedgerExecuteStatement.SHARED_TRANSACTION_ID
    )) as Array<{ Count: number }>)[0].Count
  } catch (error) {
    throw makeRowsLimitError()
  }

  for (
    let [factor, size]: [number, number] = [2, Math.ceil(limit / 2)];
    !Number.isNaN(factor);
    void ([factor, size] = [
      factor < limit
        ? Math.ceil(limit / (factor * 2)) * (factor * 2) - limit <=
          Math.ceil(limit / (factor * 2))
          ? factor * 2
          : limit
        : Number.NaN,
      Math.ceil(limit / (factor * 2)),
    ])
  ) {
    try {
      return Array.from<JsonMap>([]).concat(
        ...(await Promise.all(
          Array.from<never>({ length: factor }).map((_, index) =>
            retrieveRows(
              pool,
              fieldList,
              query,
              skip + index * size,
              index < factor - 1 ? size : limit - (factor - 1) * size
            )
          )
        ))
      )
    } catch (error) {
      if (error !== RETRY_LIMIT) {
        throw RETRY_LIMIT
      }
    }
  }

  throw makeRowsLimitError()
}

export default find
