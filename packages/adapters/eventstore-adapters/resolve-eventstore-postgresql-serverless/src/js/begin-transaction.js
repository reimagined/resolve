const beginTransaction = async pool => {
  const result = await pool.rdsDataService
    .beginTransaction({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      database: 'postgres'
    })
    .promise()

  const { transactionId } = result

  return transactionId
}

export default beginTransaction
