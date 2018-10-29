const longStringSqlType =
  'VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL'
const longNumberSqlType = 'BIGINT NOT NULL'
const customObjectSqlType = 'JSON NULL'

const init = async ({ mysql, escapeId, escape }, pool) => {
  const { host, port, user, password, database, tableName } = pool.config

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database
  })

  await connection.execute(
    `CREATE TABLE IF NOT EXISTS ${escapeId(tableName)}(
      \`timestamp\` ${longNumberSqlType},
      \`aggregateId\` ${longStringSqlType},
      \`aggregateVersion\` ${longNumberSqlType},
      \`type\` ${longStringSqlType},
      \`payload\` ${customObjectSqlType},
      PRIMARY KEY(\`aggregateId\`, \`aggregateVersion\`),
      INDEX USING BTREE(\`aggregateId\`),
      INDEX USING BTREE(\`aggregateVersion\`),
      INDEX USING BTREE(\`type\`),
      INDEX USING BTREE(\`timestamp\`)
    )`,
    []
  )

  Object.assign(pool, {
    connection,
    tableName,
    escapeId,
    escape
  })
}

export default init
