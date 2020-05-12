import { EOL } from 'os'

const executeStatement = async (pool, sql) => {
  const errors = []
  let rows = null

  try {
    const { coercer } = pool

    const result = await pool.rdsDataService
      .executeStatement({
        resourceArn: pool.dbClusterOrInstanceArn,
        secretArn: pool.awsSecretStoreArn,
        database: 'postgres',
        continueAfterTimeout: false,
        includeResultMetadata: true,
        sql
      })
      .promise()

    const { columnMetadata, records } = result

    if (Array.isArray(records) && columnMetadata != null) {
      rows = []
      for (const record of records) {
        const row = {}
        for (let i = 0; i < columnMetadata.length; i++) {
          row[columnMetadata[i].name] = coercer(record[i])
        }
        rows.push(row)
      }
    }
  } catch (error) {
    errors.push({ message: sql, stack: '' })
    errors.push(error)
  }

  if (errors.length > 0) {
    const error = new Error()
    error.message = errors.map(({ message }) => message).join(EOL)
    error.stack = errors.map(({ stack }) => stack).join(EOL)
    throw error
  }

  return rows
}

export default executeStatement
