import { OMIT_BATCH } from 'resolve-readmodel-base'

const executeStatement = async (pool, sql) => {
  try {
    const transactionScope =
      pool.xaTransactionId != null
        ? {
            transactionId: pool.xaTransactionId
          }
        : pool.transactionId != null
        ? {
            transactionId: pool.transactionId
          }
        : {}
    const result = await pool.rdsDataService.executeStatement({
      ...transactionScope,
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      database: 'postgres',
      continueAfterTimeout: false,
      includeResultMetadata: true,
      sql
    })

    const { columnMetadata, records } = result

    if (!Array.isArray(records) || columnMetadata == null) {
      return null
    }

    const rows = []
    for (const record of records) {
      const row = {}
      for (let i = 0; i < columnMetadata.length; i++) {
        row[columnMetadata[i].name] = pool.coercer(record[i])
      }
      rows.push(row)
    }

    return rows
  } catch (error) {
    if (
      error != null &&
      pool.xaTransactionId != null &&
      /Transaction .*? Is Not Found/i.test(error.message)
    ) {
      throw OMIT_BATCH
    }
    throw error
  }
}

export default executeStatement
