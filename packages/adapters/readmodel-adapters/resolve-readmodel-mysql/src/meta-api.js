const connect = async ({ mysql, escapeId }, pool, options) => {
  const { checkStoredTableSchema, metaName, ...connectionOptions } = options
  const connection = await mysql.createConnection(connectionOptions)

  await connection.execute(`CREATE TABLE IF NOT EXISTS ${escapeId(metaName)} (
    \`FirstKey\` VARCHAR(128) NOT NULL,
    \`SecondKey\` VARCHAR(128) NOT NULL DEFAULT '',
    \`Value\` JSON NULL,
    PRIMARY KEY(\`FirstKey\`, \`SecondKey\`),
    INDEX USING BTREE(\`FirstKey\`)
  )`)

  pool.metaInfo = {
    tables: {},
    timestamp: 0,
    aggregatesVersionsMap: new Map()
  }

  let [rows] = await connection.execute(
    `SELECT \`Value\` AS \`Timestamp\` FROM ${escapeId(metaName)}
   WHERE \`FirstKey\`="Timestamp"`
  )

  if (rows.length === 0) {
    await connection.execute(
      `INSERT INTO ${escapeId(metaName)}(\`FirstKey\`, \`Value\`)
     VALUES("Timestamp", CAST("0" AS JSON))`
    )
  } else {
    pool.metaInfo.timestamp = Number.isInteger(+rows[0]['Timestamp'])
      ? +rows[0]['Timestamp']
      : 0
  }

  void ([rows] = await connection.execute(
    `SELECT \`SecondKey\` AS \`AggregateId\`, \`Value\` AS \`AggregateVersion\`
   FROM ${escapeId(metaName)}
   WHERE \`FirstKey\`="AggregatesVersionsMap"`
  ))

  for (let { AggregateId, AggregateVersion } of rows) {
    pool.metaInfo.aggregatesVersionsMap.set(AggregateId, AggregateVersion)
  }

  void ([rows] = await connection.execute(
    `SELECT \`SecondKey\` AS \`TableName\`, \`Value\` AS \`TableDescription\`
   FROM ${escapeId(metaName)}
   WHERE \`FirstKey\`="TableDescriptor"`
  ))

  for (let { TableName, TableDescription } of rows) {
    if (checkStoredTableSchema(TableName, TableDescription)) {
      pool.metaInfo.tables[TableName] = TableDescription
      continue
    }

    // eslint-disable-next-line no-console
    console.log(
      `Can't table "${TableName}" meta information due invalid schema: ${JSON.stringify(
        TableDescription
      )}`
    )

    await connection.execute(
      `DELETE FROM ${escapeId(metaName)}
       WHERE \`FirstKey\`="TableDescriptor"
       AND \`SecondKey\`=?`,
      [TableName]
    )
  }

  Object.assign(pool, {
    metaName,
    escapeId,
    connection
  })
}

const getLastTimestamp = async ({ metaInfo }) => {
  return metaInfo.timestamp
}

const setLastTimestamp = async (
  { connection, escapeId, metaName, metaInfo },
  timestamp
) => {
  await connection.execute(
    `UPDATE ${escapeId(metaName)} SET \`Value\`=CAST(? AS JSON)
    WHERE \`FirstKey\`="Timestamp"`,
    [JSON.stringify(timestamp)]
  )

  metaInfo.timestamp = +timestamp
}

const setLastAggregateVersion = async (
  { connection, escapeId, metaName, metaInfo },
  aggregateId,
  aggregateVersion
) => {
  await connection.execute(
    `INSERT INTO ${escapeId(metaName)}(\`FirstKey\`, \`SecondKey\`, \`Value\`)
    VALUES("AggregatesVersionsMap", ?, CAST(? AS JSON))
    ON DUPLICATE KEY UPDATE \`Value\` = CAST(? AS JSON)`,
    [
      aggregateId,
      JSON.stringify(aggregateVersion),
      JSON.stringify(aggregateVersion)
    ]
  )

  metaInfo.aggregatesVersionsMap.set(aggregateId, aggregateVersion)
}

const getLastAggregatesVersions = async ({ metaInfo }) => {
  return metaInfo.aggregatesVersionsMap
}

const tableExists = async ({ metaInfo }, tableName) => {
  return !!metaInfo.tables[tableName]
}

const getTableInfo = async ({ metaInfo }, tableName) => {
  return metaInfo.tables[tableName]
}

const describeTable = async (
  { connection, escapeId, metaInfo, metaName },
  tableName,
  metaSchema
) => {
  await connection.execute(
    `INSERT INTO ${escapeId(metaName)}(\`FirstKey\`, \`SecondKey\`, \`Value\`)
    VALUES("TableDescriptor", ?, CAST(? AS JSON))`,
    [tableName, JSON.stringify(metaSchema)]
  )

  metaInfo.tables[tableName] = metaSchema
}

const getTableNames = async ({ metaInfo }) => {
  return Object.keys(metaInfo.tables)
}

const disconnect = async ({ connection }) => {
  await connection.end()
}

const drop = async (
  { connection, escapeId, metaName, metaInfo },
  { dropMetaTable, dropDataTables } = {}
) => {
  if (dropDataTables) {
    for (let tableName of Object.keys(metaInfo.tables)) {
      await connection.execute(`DROP TABLE ${escapeId(tableName)}`)
    }
  }

  if (dropMetaTable) {
    await connection.execute(`DROP TABLE ${escapeId(metaName)}`)

    for (let key of Object.keys(metaInfo)) {
      delete metaInfo[key]
    }
  }
}

export default {
  connect,
  getLastTimestamp,
  setLastTimestamp,
  setLastAggregateVersion,
  getLastAggregatesVersions,
  tableExists,
  getTableInfo,
  describeTable,
  getTableNames,
  disconnect,
  drop
}
