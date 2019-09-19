const connect = async (
  pool,
  {
    RDSDataService,
    escapeId,
    escape,
    fullJitter,
    randRange,
    executeStatement,
    coercer
  }
) => {
  const {
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    tableName,
    databaseName,
    // eslint-disable-next-line no-unused-vars
    skipInit,
    ...config
  } = pool.config

  const rdsDataService = new RDSDataService(config)

  Object.assign(pool, {
    rdsDataService,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    tableName,
    databaseName,
    fullJitter,
    randRange,
    coercer,
    executeStatement: executeStatement.bind(null, pool),
    escapeId,
    escape
  })
}

export default connect
