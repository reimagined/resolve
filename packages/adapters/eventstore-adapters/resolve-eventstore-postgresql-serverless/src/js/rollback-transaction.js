const rollbackTransaction = async (pool, transactionId) => {
  await pool.rdsDataService
    .rollbackTransaction({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      transactionId
    })
    .promise()
}

export default rollbackTransaction
