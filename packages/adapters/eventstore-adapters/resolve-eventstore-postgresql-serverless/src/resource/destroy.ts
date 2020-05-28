import { EOL } from 'os'
import getLog from '../js/get-log'
import { AdapterPool, CloudResourceOptions, CloudResourcePool } from '../types'

const destroy = async (
  pool: CloudResourcePool,
  options: CloudResourceOptions
): Promise<any> => {
  const log = getLog(`resource: destroy`)

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

  log.debug(`configuring adapter with environment privileges`)
  const adminPool: AdapterPool = {
    config: {
      region: options.region,
      awsSecretStoreArn: options.awsSecretStoreAdminArn,
      dbClusterOrInstanceArn: options.dbClusterOrInstanceArn,
      databaseName: options.databaseName,
      tableName: options.tableName,
      secretsTableName: options.secretsTableName,
      snapshotsTableName: options.snapshotsTableName
    }
  }

  log.debug(`connecting the adapter`)
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
    log.debug(`altering schema owner`)
    await executeStatement(
      adminPool,
      `ALTER SCHEMA ${escapeId(options.databaseName)} OWNER TO SESSION_USER`
    )
  } catch (error) {
    alterSchemaError = error
  }

  try {
    log.debug(`dropping schema with all its tables`)
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

    log.error(error.message)
    log.verbose(error.stack || error.message)

    throw error
  }

  log.debug(`disposing the adapter`)
  await dispose(adminPool)

  log.debug(`resource destroyed successfully`)
}

export default destroy
