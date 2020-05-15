import { KeyStoreOptions } from '../types'
import executeStatement from './executeStatement'

const escapeId = (str: string): string =>
  `"${String(str).replace(/(["])/gi, '$1$1')}"`

const destroy = async (pool: any, options: any): Promise<void> => {
  const { RDSDataService } = pool
  const { region } = options
  const rdsDataService = new RDSDataService({ region })

  let alterSchemaError = null
  let dropSchemaError = null

  const keyStoreOptions: KeyStoreOptions = {
    region,
    resourceArn: options.dbClusterOrInstanceArn,
    secretArn: options.awsSecretStoreAdminArn,
    databaseName: options.databaseName,
    tableName: options.tableName
  }

  try {
    await executeStatement(
      rdsDataService,
      keyStoreOptions,
      `ALTER SCHEMA ${escapeId(options.databaseName)} OWNER TO SESSION_USER`
    )
  } catch (error) {
    alterSchemaError = error
  }

  try {
    await executeStatement(
      rdsDataService,
      keyStoreOptions,
      `DROP SCHEMA ${escapeId(options.databaseName)} CASCADE`
    )
  } catch (error) {
    dropSchemaError = error
  }

  if (alterSchemaError != null || dropSchemaError != null) {
    const error = new Error()
    error.message = `${
      alterSchemaError != null ? `${alterSchemaError.message}\n` : ''
    }${dropSchemaError != null ? `${dropSchemaError.message}\n` : ''}`

    throw error
  }
}

export default destroy
