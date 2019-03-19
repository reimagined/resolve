const init = async ({ database, escapeId, tableName }) => {
  await database.exec(
    `CREATE TABLE IF NOT EXISTS ${escapeId(tableName)}(
      \`timestamp\` BIGINT NOT NULL,
      \`aggregateId\` VARCHAR(700) NOT NULL,
      \`aggregateVersion\` BIGINT NOT NULL,
      \`type\` VARCHAR(700) NOT NULL,
      \`payload\`JSON NULL,
      PRIMARY KEY(\`aggregateId\`, \`aggregateVersion\`),
      INDEX USING BTREE(\`aggregateId\`),
      INDEX USING BTREE(\`aggregateVersion\`),
      INDEX USING BTREE(\`type\`),
      INDEX USING BTREE(\`timestamp\`)
    )`
  )
}

export default init
