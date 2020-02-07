const connect = async (
  pool,
  {
    Postgres,
    escapeId,
    escape,
    fullJitter,
    randRange,
    executeStatement,
    coercer
  }
) => {
  Object.assign(pool, {
    databaseName: pool.config.databaseName,
    tableName: pool.config.tableName,
    Postgres,
    fullJitter,
    randRange,
    coercer,
    executeStatement: executeStatement.bind(null, pool),
    escapeId,
    escape
  })
}

export default connect
