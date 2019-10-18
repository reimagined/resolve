const beginTransaction = async (pool, readModelName) => {
  if (pool.transactionId != null) {
    try {
      await pool.rollbackTransaction(pool.transactionId)
    } catch (error) {}
  }

  const { transactionId } = await pool.rdsDataService
    .beginTransaction({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      database: 'postgres'
    })
    .promise()

  pool.transactionId = transactionId
  pool.readModelName = readModelName
}

export default beginTransaction
