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
  const rdsDataService = new RDSDataService({ region: pool.config.region })

  Object.assign(pool, {
    tableName: pool.config.tableName,
    rdsDataService,
    fullJitter,
    randRange,
    coercer,
    executeStatement: executeStatement.bind(null, pool),
    databaseName: pool.config.databaseName,
    escapeId,
    escape
  })
}

export default connect
