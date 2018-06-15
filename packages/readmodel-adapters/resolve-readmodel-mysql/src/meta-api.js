const PROPER_NAME_REGEXP = /^(?:\w|\d|-)+?$/

const getMetaInfo = async pool => {
  const { connection, escapeId, metaName } = pool

  await connection.execute(`CREATE TABLE IF NOT EXISTS ${escapeId(metaName)} (
      FirstKey VARCHAR(128) NOT NULL,
      SecondKey VARCHAR(128) NULL,
      Value JSON NULL,
      PRIMARY KEY (FirstKey)
    )`)

  pool.metaInfo = { tables: {}, timestamp: 0 }

  let [rows] = await connection.execute(
    `SELECT Value AS Timestamp FROM ${escapeId(metaName)}
     WHERE FirstKey="Timestamp"`
  )

  if (rows.length === 0) {
    await connection.execute(
      `INSERT INTO ${escapeId(metaName)}(FirstKey, Value)
       VALUES("Timestamp", 0)`
    )
  } else {
    pool.metaInfo.timestamp = Number.isInteger(+rows[0]['Timestamp']) ? +rows[0]['Timestamp'] : 0
  }

  void ([rows] = await connection.execute(
    `SELECT SecondKey AS TableName, Value AS TableDescription
     FROM ${escapeId(metaName)}
     WHERE FirstKey="TableDescriptor"`
  ))

  for (let { TableName, TableDescription } of rows) {
    try {
      if (
        !PROPER_NAME_REGEXP.test(TableName) ||
        !Array.isArray(TableDescription.columns) ||
        !Array.isArray(TableDescription.indexes) ||
        TableDescription.indexes.length < 1 ||
        !TableDescription.indexes.reduce(
          (result, index) => result && TableDescription.columns.indexOf(index) >= 0,
          true
        ) ||
        !TableDescription.columns.reduce(
          (result, column) => result && PROPER_NAME_REGEXP.test(column),
          true
        )
      ) {
        throw new Error(
          `Can't table "${TableName}" meta information due invalid schema: ${TableDescription}`
        )
      }

      pool.metaInfo.tables[TableName] = {
        columns: TableDescription.columns,
        indexes: TableDescription.indexes
      }
    } catch (err) {
      await connection.execute(
        `DELETE FROM ${escapeId(metaName)}
         WHERE FirstKey="TableDescriptor" AND SecondKey=?`,
        [TableName]
      )
    }
  }
}

const getLastTimestamp = async ({ metaInfo }) => {
  return metaInfo.timestamp
}

const setLastTimestamp = async ({ connection, escapeId, metaName, metaInfo }, timestamp) => {
  await connection.execute(`UPDATE ${escapeId(metaName)} SET Value=? WHERE FirstKey="Timestamp"`, [
    timestamp
  ])

  metaInfo.timestamp = +timestamp
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
    `INSERT INTO ${escapeId(metaName)}(FirstKey, SecondKey, Value) VALUES("TableDescriptor", ?, ?)`,
    [tableName, metaSchema]
  )

  metaInfo.tables[tableName] = metaSchema
}

const getTableNames = async ({ metaInfo }) => {
  return Object.keys(metaInfo.tables)
}

const drop = async ({ connection, escapeId, metaName, metaInfo }) => {
  for (let tableName of Object.keys(metaInfo.tables)) {
    await connection.execute(`DROP TABLE ${escapeId(tableName)}`)
  }

  await connection.execute(`DROP TABLE ${escapeId(metaName)}`)

  for (let key of Object.keys(metaInfo)) {
    delete metaInfo[key]
  }
}

export default {
  getMetaInfo,
  getLastTimestamp,
  setLastTimestamp,
  tableExists,
  getTableInfo,
  describeTable,
  getTableNames,
  drop
}
