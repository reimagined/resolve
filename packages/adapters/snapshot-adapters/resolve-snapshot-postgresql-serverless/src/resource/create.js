const create = async (pool, options) => {
  const { executeStatement, connect, init, escapeId, escape, dispose } = pool

  const admin = {
    config: {
      awsSecretStoreArn: options.awsSecretStoreAdminArn,
      dbClusterOrInstanceArn: options.dbClusterOrInstanceArn,
      databaseName: options.databaseName,
      tableName: options.tableName,
      region: options.region
    }
  }

  Object.assign(admin, pool)

  await connect(admin)

  await executeStatement(
    admin,
    [
      `CREATE USER ${escapeId(options.userLogin)}`,
      `ALTER USER ${escapeId(options.userLogin)} PASSWORD ${escape(
        options.userPassword
      )}`,
      `CREATE SCHEMA ${escapeId(options.databaseName)}`
    ].join('; ')
  )

  await init(admin)

  await executeStatement(
    admin,
    [
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
