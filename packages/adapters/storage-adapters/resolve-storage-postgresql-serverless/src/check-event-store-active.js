const checkEventStoreActive = async pool => {
  const { executeStatement, databaseName, tableName, escape } = pool

  const rows = await executeStatement(
    `SELECT 0 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = ${escape(databaseName)}
    AND c.relname = ${escape(`${tableName}-freeze`)}`
  )

  return rows.length === 0
}

export default checkEventStoreActive
