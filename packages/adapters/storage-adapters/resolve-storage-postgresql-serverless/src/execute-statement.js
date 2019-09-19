const executeStatement = async (pool, sql) => {
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

  if (!Array.isArray(records) || columnMetadata == null) {
    return null
  }

  const rows = []
  for (const record of records) {
    const row = {}
    for (let i = 0; i < columnMetadata.length; i++) {
      row[columnMetadata[i].name] = coercer(record[i])
    }
    rows.push(row)
  }

  return rows
}

export default executeStatement
