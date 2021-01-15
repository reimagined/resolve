import { AdapterPool } from './types'

const beginTransaction = async (pool: AdapterPool): Promise<any> => {
  const result: any = await pool.rdsDataService
    .beginTransaction({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      database: 'postgres',
    })
    .promise()

  const { transactionId } = result

  return transactionId
}

export default beginTransaction
