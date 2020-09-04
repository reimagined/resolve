const freeze = async ({
  events: { connection, eventsTableName },
  escapeId,
}) => {
  await connection.execute(
    `CREATE TABLE IF NOT EXISTS ${escapeId(`${eventsTableName}-freeze`)}(
      ${escapeId('surrogate')} BIGINT NOT NULL,
      PRIMARY KEY(${escapeId('surrogate')})
    )
    COMMENT = "RESOLVE EVENT STORE ${escapeId(eventsTableName)} FREEZE MARKER" 
    `
  )
}

export default freeze
