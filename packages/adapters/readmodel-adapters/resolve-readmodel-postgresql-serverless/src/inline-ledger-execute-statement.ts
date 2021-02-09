import type { InlineLedgerExecuteStatementMethod, JsonLike } from './types'

const inlineLedgerExecuteStatement: InlineLedgerExecuteStatementMethod = async (
  pool,
  sql,
  transactionId = null,
  passthroughRuntimeErrors = false
) => {
  const {
    PassthroughError,
    rdsDataService,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    coercer,
  } = pool
  try {
    const result = await rdsDataService.executeStatement({
      resourceArn: dbClusterOrInstanceArn,
      secretArn: awsSecretStoreArn,
      database: 'postgres',
      continueAfterTimeout: false,
      includeResultMetadata: true,
      ...(transactionId != null ? { transactionId } : {}),
      sql,
    })

    const { columnMetadata, records } = result

    if (!Array.isArray(records) || columnMetadata == null) {
      return []
    }

    const rows: Array<object> = []
    for (const record of records) {
      const row: Record<string, JsonLike> = {}
      for (let i = 0; i < columnMetadata.length; i++) {
        const columnName = columnMetadata[i].name
        if (columnName != null) {
          row[columnName] = pool.coercer(record[i])
        }
      }
      rows.push(row)
    }

    return rows
  } catch (error) {
    if (
      PassthroughError.isPassthroughError(error, !!passthroughRuntimeErrors)
    ) {
      throw new PassthroughError(transactionId)
    }

    throw error
  }
}

export default inlineLedgerExecuteStatement
