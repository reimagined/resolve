const checkEventStoreActive = async ({ database, tableName, escape }) => {
  const rows = await database.all(
    `SELECT 0 FROM sqlite_master WHERE type=${escape('table')}
    AND name=${escape(`${tableName}-freeze`)}`
  )

  return rows.length === 0
}

export default checkEventStoreActive
