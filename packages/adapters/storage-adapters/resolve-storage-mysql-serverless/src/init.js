const longStringSqlType =
  'VARCHAR(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL'
const longNumberSqlType = 'BIGINT NOT NULL'
const longTextSqlType =
  'LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL'

const init = async ({
  resourceOptions: { databaseName, tableName, userLogin, userPassword },
  executeSql,
  escapeId,
  escape
}) => {
  await executeSql(`CREATE DATABASE ${escapeId(databaseName)}`)

  await executeSql(
    `CREATE USER ${escape(userLogin)} IDENTIFIED BY ${escape(userPassword)}`
  )

  await executeSql(
    `GRANT ALL ON ${escapeId(databaseName)}.* TO ${escape(userLogin)}@'%'`
  )

  await executeSql(
    `CREATE TABLE IF NOT EXISTS ${escapeId(databaseName)}.${escapeId(
      tableName
    )}(
      ${escapeId('eventId')} ${longNumberSqlType},
      ${escapeId('timestamp')} ${longNumberSqlType},
      ${escapeId('aggregateId')} ${longStringSqlType},
      ${escapeId('aggregateVersion')} ${longNumberSqlType},
      ${escapeId('type')} ${longStringSqlType},
      ${escapeId('payload')} ${longTextSqlType},
      PRIMARY KEY(${escapeId('eventId')}),
      INDEX USING BTREE(${escapeId('aggregateId')}, ${escapeId(
      'aggregateVersion'
    )}),
      INDEX USING BTREE(${escapeId('aggregateId')}),
      INDEX USING BTREE(${escapeId('aggregateVersion')}),
      INDEX USING BTREE(${escapeId('type')}),
      INDEX USING BTREE(${escapeId('timestamp')}),
      UNIQUE(${escapeId('aggregateId')}, ${escapeId('aggregateVersion')})
    )`
  )

  await executeSql(
    `CREATE TABLE IF NOT EXISTS ${escapeId(databaseName)}.${escapeId(
      `${tableName}-sequence`
    )}(
      ${escapeId('key')} ${longNumberSqlType},
      ${escapeId('eventId')} ${longNumberSqlType},
      ${escapeId('timestamp')} ${longNumberSqlType},
      ${escapeId('transactionId')} ${longNumberSqlType},
      PRIMARY KEY(${escapeId('key')})
    )`
  )

  await executeSql(
    `INSERT INTO ${escapeId(databaseName)}.${escapeId(`${tableName}-sequence`)}(
      ${escapeId('key')},
      ${escapeId('eventId')},
      ${escapeId('timestamp')},
      ${escapeId('transactionId')}
    ) VALUES (
      0, 0, 0, 0
    )`
  )
}

export default init
