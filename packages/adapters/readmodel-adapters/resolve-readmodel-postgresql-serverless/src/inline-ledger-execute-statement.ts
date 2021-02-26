import type {
  InlineLedgerExecuteStatementMethod,
  ExtractFunction,
  JsonLike,
} from './types'

const SHARED_TRANSACTION_ID = Symbol('SHARED_TRANSACTION_ID')

const inlineLedgerExecuteStatement: InlineLedgerExecuteStatementMethod = Object.assign(
  (async (
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
      sharedTransactionId,
    } = pool
    for (;;) {
      try {
        const transactionScope =
          transactionId != null
            ? transactionId.constructor === String
              ? { transactionId }
              : transactionId === SHARED_TRANSACTION_ID
              ? sharedTransactionId != null
                ? { transactionId: sharedTransactionId }
                : {}
              : (() => {
                  throw new Error('Invalid transactionId')
                })()
            : {}

        const result = await rdsDataService.executeStatement({
          resourceArn: dbClusterOrInstanceArn,
          secretArn: awsSecretStoreArn,
          database: 'postgres',
          continueAfterTimeout: false,
          includeResultMetadata: true,
          ...transactionScope,
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
              row[columnName] = coercer(record[i])
            }
          }
          rows.push(row)
        }

        return rows
      } catch (error) {
        if (pool.activePassthrough) {
          if (
            PassthroughError.isPassthroughError(
              error,
              !!passthroughRuntimeErrors
            )
          ) {
            throw new PassthroughError(
              transactionId != null && transactionId.constructor === String
                ? transactionId
                : null
            )
          }

          throw error
        } else {
          if (PassthroughError.isPassthroughError(error, false)) {
            await new Promise((resolve) => setTimeout(resolve, 100))
          } else {
            throw error
          }
        }
      }
    }
  }) as ExtractFunction<InlineLedgerExecuteStatementMethod>,
  {
    SHARED_TRANSACTION_ID,
  }
)

export default inlineLedgerExecuteStatement
