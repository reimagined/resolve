import { AdapterPool } from './types'

const rollbackTransaction = async (
  pool: AdapterPool,
  transactionId: string
): Promise<void> => {
  await pool.rdsDataService
    .rollbackTransaction({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      transactionId,
    })
    .promise()
}

export default rollbackTransaction
