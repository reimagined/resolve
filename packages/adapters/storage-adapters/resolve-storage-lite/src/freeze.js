const freeze = async ({ database, tableName, escapeId }) => {
  await database.exec(
    `CREATE TABLE ${escapeId(`${tableName}-freeze`)}(
      -- RESOLVE EVENT STORE ${escapeId(tableName)} FREEZE MARKER
      ${escapeId('surrogate')} BIGINT NOT NULL,
      PRIMARY KEY(${escapeId('surrogate')}
    )`
  )
}

export default freeze
