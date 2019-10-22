const create = async (pool, options) => {
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

  const admin = {
    config: {
      awsSecretStoreArn: options.awsSecretStoreAdminArn,
      dbClusterOrInstanceArn: options.dbClusterOrInstanceArn,
      databaseName: options.databaseName,
      tableName: options.tableName,
      region: options.region
    }
  }
  await connect(
    admin,
    {
      RDSDataService,
      escapeId,
      escape,
      fullJitter,
      executeStatement,
      coercer
    }
  )

  await executeStatement(
    admin,
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
      )}`
    ].join('; ')
  )

  await dispose(admin)
}

export default create
