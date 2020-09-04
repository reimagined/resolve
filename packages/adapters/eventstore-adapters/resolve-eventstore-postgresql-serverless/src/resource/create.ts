import getLog from '../js/get-log'
import { AdapterPool, CloudResourceOptions, CloudResourcePool } from '../types'

const create = async (
  pool: CloudResourcePool,
  options: CloudResourceOptions
): Promise<any> => {
  const log = getLog('resource:create')

  const {
    executeStatement,
    connect,
    RDSDataService,
    escapeId,
    escape,
    fullJitter,
    coercer,
    dispose,
  } = pool

  log.debug(`configuring adapter with environment privileges`)
  const adminPool: AdapterPool = {
    config: {
      region: options.region,
      awsSecretStoreArn: options.awsSecretStoreAdminArn,
      dbClusterOrInstanceArn: options.dbClusterOrInstanceArn,
      databaseName: options.databaseName,
      eventsTableName: options.eventsTableName,
      secretsTableName: options.secretsTableName,
      snapshotsTableName: options.snapshotsTableName,
    },
  }

  log.debug(`connecting the adapter`)
  await connect(adminPool, {
    RDSDataService,
    escapeId,
    escape,
    fullJitter,
    executeStatement,
    coercer,
  })

  log.debug(`building schema and granting privileges to user`)
  await executeStatement(
    adminPool,
    [
      `CREATE SCHEMA ${escapeId(options.databaseName)}`,

      `GRANT USAGE ON SCHEMA ${escapeId(options.databaseName)} TO ${escapeId(
        options.userLogin
      )}`,

      `GRANT ALL ON SCHEMA ${escapeId(options.databaseName)} TO ${escapeId(
        options.userLogin
      )}`,

      `GRANT ALL ON ALL TABLES IN SCHEMA ${escapeId(
        options.databaseName
      )} TO ${escapeId(options.userLogin)}`,

      `GRANT ALL ON ALL SEQUENCES IN SCHEMA ${escapeId(
        options.databaseName
      )} TO ${escapeId(options.userLogin)}`,

      `GRANT ALL ON ALL FUNCTIONS IN SCHEMA ${escapeId(
        options.databaseName
      )} TO ${escapeId(options.userLogin)}`,

      `ALTER SCHEMA ${escapeId(options.databaseName)} OWNER TO ${escapeId(
        options.userLogin
      )}`,
    ].join('; ')
  )

  log.debug(`disposing the adapter`)
  await dispose(adminPool)

  log.debug(`resource created successfully`)
}

export default create
