const longStringSqlType =
  'VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL'
const longNumberSqlType = 'BIGINT NOT NULL'
const longTextSqlType =
  'LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL'

const init = async ({ tableName, executeSql, escapeId }) => {
  await executeSql(
    `CREATE TABLE IF NOT EXISTS ${escapeId(tableName)}(
      \`eventId\` ${longNumberSqlType} AUTO_INCREMENT,
      \`timestamp\` ${longNumberSqlType},
      \`aggregateId\` ${longStringSqlType},
      \`aggregateVersion\` ${longNumberSqlType},
      \`type\` ${longStringSqlType},
      \`payload\` ${longTextSqlType},
      PRIMARY KEY(\`eventId\`),
      INDEX USING BTREE(\`aggregateId\`, \`aggregateVersion\`),
      INDEX USING BTREE(\`aggregateId\`),
      INDEX USING BTREE(\`aggregateVersion\`),
      INDEX USING BTREE(\`type\`),
      INDEX USING BTREE(\`timestamp\`),
      UNIQUE(\`aggregateId\`, \`aggregateVersion\`)
    )`,
    []
  )
}

export default init
