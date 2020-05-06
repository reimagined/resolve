import { EOL } from 'os'
import { AdapterPool, CloudResourceOptions, CloudResourcePool } from '../types'

const destroy = async (
  pool: CloudResourcePool,
  options: CloudResourceOptions
): Promise<any> => {
  const {
    executeStatement,
    connect,
    RDSDataService,
    escapeId,
    escape,
    fullJitter,
    coercer,
    dispose
  } = pool

  const adminPool: AdapterPool = {
    config: {
      awsSecretStoreArn: options.awsSecretStoreAdminArn,
      dbClusterOrInstanceArn: options.dbClusterOrInstanceArn,
      databaseName: options.databaseName,
      tableName: options.tableName,
      region: options.region,
      secretsTableName: options.secretsTableName
    }
  }
  await connect(adminPool, {
    RDSDataService,
    escapeId,
    escape,
    fullJitter,
    executeStatement,
    coercer
  })

  let alterSchemaError = null
  let dropSchemaError = null

  try {
    await executeStatement(
      adminPool,
      `ALTER SCHEMA ${escapeId(options.databaseName)} OWNER TO SESSION_USER`
    )
  } catch (error) {
    alterSchemaError = error
  }

  try {
    await executeStatement(
      adminPool,
      `DROP SCHEMA ${escapeId(options.databaseName)} CASCADE`
    )
  } catch (error) {
    dropSchemaError = error
  }

  if (alterSchemaError != null || dropSchemaError != null) {
    const error = new Error()
    error.message = `${
      alterSchemaError != null ? `${alterSchemaError.message}${EOL}` : ''
    }${dropSchemaError != null ? `${dropSchemaError.message}${EOL}` : ''}`

    throw error
  }

  await dispose(adminPool)
}

export default destroy
