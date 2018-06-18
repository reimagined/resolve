const PROPER_NAME_REGEXP = /^(?:\w|\d|-)+?$/

const PRIMARY_INDEX_TYPES = ['primary-number', 'primary-string']
const SECONDARY_INDEX_TYPES = ['secondary-number', 'secondary-string']
const FIELD_TYPES = [...PRIMARY_INDEX_TYPES, ...SECONDARY_INDEX_TYPES, 'regular']

const checkStoredTableSchema = (tableName, tableDescription) =>
  PROPER_NAME_REGEXP.test(tableName) &&
  tableDescription != null &&
  tableDescription.constructor === Object &&
  Object.keys(tableDescription).reduce(
    (result, fieldName) =>
      result &&
      PROPER_NAME_REGEXP.test(fieldName) &&
      FIELD_TYPES.indexOf(tableDescription[fieldName]) > -1,
    true
  ) &&
  Object.keys(tableDescription).reduce(
    (result, fieldName) =>
      result + (PRIMARY_INDEX_TYPES.indexOf(tableDescription[fieldName]) > -1 ? 1 : 0),
    0
  ) === 1

const getMetaInfo = async pool => {
  const { connection, escapeId, metaName } = pool

  await connection.execute(`CREATE TABLE IF NOT EXISTS ${escapeId(metaName)} (
      FirstKey VARCHAR(128) NOT NULL,
      SecondKey VARCHAR(128) NULL,
      Value JSON NULL
    )`)

  pool.metaInfo = { tables: {}, timestamp: 0 }

  let [rows] = await connection.execute(
    `SELECT Value AS Timestamp FROM ${escapeId(metaName)}
     WHERE FirstKey="Timestamp"`
  )

  if (rows.length === 0) {
    await connection.execute(
      `INSERT INTO ${escapeId(metaName)}(FirstKey, Value)
       VALUES("Timestamp", CAST("0" AS JSON))`
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
         WHERE FirstKey="TableDescriptor" AND SecondKey=?`,
      [TableName]
    )
  }
}

const getLastTimestamp = async ({ metaInfo }) => {
  return metaInfo.timestamp
}

const setLastTimestamp = async ({ connection, escapeId, metaName, metaInfo }, timestamp) => {
  await connection.execute(
    `UPDATE ${escapeId(metaName)} SET Value=CAST(? AS JSON) WHERE FirstKey="Timestamp"`,
    [JSON.stringify(timestamp)]
  )

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
    `INSERT INTO ${escapeId(
      metaName
    )}(FirstKey, SecondKey, Value) VALUES("TableDescriptor", ?, CAST(? AS JSON))`,
    [tableName, JSON.stringify(metaSchema)]
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
