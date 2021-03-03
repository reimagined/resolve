import { EOL } from 'os'
import getLog from '../get-log'
import { AdminPool, CloudResourceOptions, CloudResourcePool } from '../types'

const destroy = async (
  pool: CloudResourcePool,
  options: CloudResourceOptions
): Promise<void> => {
  const log = getLog(`resource: destroy`)

  const {
    executeStatement: _executeStatement,
    connect: _connect,
    RDSDataService,
    escapeId,
    escape,
    fullJitter,
    coercer,
    dispose: _dispose,
  } = pool

  const connect = (_connect as unknown) as typeof _connect extends (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: infer _,
    ...args: infer Args
  ) => infer R
    ? (_: AdminPool, ...args: Args) => R
    : never

  const executeStatement = (_executeStatement as unknown) as typeof _executeStatement extends (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: infer _,
    ...args: infer Args
  ) => infer R
    ? (_: AdminPool, ...args: Args) => R
    : never

  const dispose = (_dispose as unknown) as typeof _dispose extends (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: infer _,
    ...args: infer Args
  ) => infer R
    ? (_: AdminPool, ...args: Args) => R
    : never

  log.debug(`configuring adapter with environment privileges`)
  const adminPool: AdminPool = {}

  log.debug(`connecting the adapter`)
  await connect(
    adminPool,
    {
      RDSDataService,
      escapeId,
      escape,
      fullJitter,
      executeStatement,
      coercer,
    },
    {
      region: options.region,
      awsSecretStoreArn: options.awsSecretStoreAdminArn,
      dbClusterOrInstanceArn: options.dbClusterOrInstanceArn,
      databaseName: options.databaseName,
      eventsTableName: options.eventsTableName,
      secretsTableName: options.secretsTableName,
      snapshotsTableName: options.snapshotsTableName,
    }
  )

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
