import { KeyStoreOptions } from '../types'

const escapeId = (str: string): string =>
  `"${String(str).replace(/(["])/gi, '$1$1')}"`

const create = async (pool: any, options: any): Promise<void> => {
  const { RDSDataService, executeStatement } = pool

  const { region } = options

  const rdsDataService = new RDSDataService({ region })
  const keyStoreOptions: KeyStoreOptions = {
    region,
    resourceArn: options.dbClusterOrInstanceArn,
    secretArn: options.awsSecretStoreAdminArn,
    databaseName: options.databaseName,
    tableName: options.tableName
  }
  await executeStatement(
    rdsDataService,
    keyStoreOptions,
    [
      `CREATE SCHEMA IF NOT EXISTS ${escapeId(options.databaseName)}`,

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
      )}`
    ].join('; ')
  )
}

export default create
