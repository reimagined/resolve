const longStringSqlType =
  'VARCHAR(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL'
const longNumberSqlType = 'BIGINT NOT NULL'
const longTextSqlType =
  'LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL'

const init = async ({ tableName, executeSql, escapeId }) => {
  await executeSql(
    `CREATE TABLE IF NOT EXISTS ${escapeId(tableName)}(
      ${escapeId('eventId')} ${longNumberSqlType} AUTO_INCREMENT,
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
    )`,
    []
  )
}

export default init
