const rollbackTransaction = async pool => {
  await pool.rdsDataService
    .rollbackTransaction({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      transactionId: pool.transactionId
    })
    .promise()

  pool.transactionId = null
}

export default rollbackTransaction
