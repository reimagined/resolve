const commitTransaction = async pool => {
  await pool.rdsDataService
    .commitTransaction({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      transactionId: pool.transactionId
    })
    .promise()

  pool.transactionId = null
}

export default commitTransaction
