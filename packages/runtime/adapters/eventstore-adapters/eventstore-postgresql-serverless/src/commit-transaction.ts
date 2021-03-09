import { AdapterPool } from './types'

const commitTransaction = async (
  pool: AdapterPool,
  transactionId: string
): Promise<void> => {
  await pool.rdsDataService
    .commitTransaction({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      transactionId,
    })
    .promise()
}

export default commitTransaction
