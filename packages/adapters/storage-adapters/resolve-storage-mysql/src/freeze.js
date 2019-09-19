const deactivate = async ({ connection, tableName, escapeId }) => {
  await connection.execute(
    `CREATE TABLE IF NOT EXISTS ${escapeId(`${tableName}-freeze`)}(
      ${escapeId('surrogate')} BIGINT NOT NULL,
      PRIMARY KEY(${escapeId('surrogate')})
    )
    COMMENT = "RESOLVE EVENT STORE ${escapeId(tableName)} FREEZE MARKER" 
    `
  )
}

export default deactivate
