const commitTransaction = async (pool, transactionId) => {
  await pool.rdsDataService
    .commitTransaction({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      transactionId
    })
    .promise()
}

export default commitTransaction
