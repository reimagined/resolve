import { EOL } from 'os'

const isHighloadError = error =>
  error != null &&
  (/Request timed out/i.test(error.message) ||
    /Remaining connection slots are reserved/i.test(error.message) ||
    /I\/O error occurr?ed/i.test(error.message) ||
    /too many clients already/i.test(error.message) ||
    /in a read-only transaction/i.test(error.message) ||
    error.code === 'ProvisionedThroughputExceededException' ||
    error.code === 'LimitExceededException' ||
    error.code === 'RequestLimitExceeded' ||
    error.code === 'ThrottlingException' ||
    error.code === 'TooManyRequestsException' ||
    error.code === 'NetworkingError')

const executeStatement = async (pool, sql) => {
  const errors = []
  let rows = null

  try {
    const { coercer } = pool

    let result = null

    while (true) {
      try {
        result = await pool.rdsDataService
          .executeStatement({
            resourceArn: pool.dbClusterOrInstanceArn,
            secretArn: pool.awsSecretStoreArn,
            database: 'postgres',
            continueAfterTimeout: false,
            includeResultMetadata: true,
            sql
          })
          .promise()
        break
      } catch (error) {
        if (!isHighloadError(error)) {
          throw error
        }
      }
    }

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
