const loadEvents = async (pool, criteria, values, callback, startTime) => {
  let [rows] = await pool.connection.execute(
    `SELECT * FROM ${pool.escapeId(pool.tableName)}
    WHERE \`timestamp\` > ? AND ${pool.escapeId(criteria)} IN (${values.map(
      () => '?'
    )})
    ORDER BY \`timestamp\` ASC, \`aggregateVersion\` ASC
    `,
    [startTime, ...values]
  )

  for (const row of rows) {
    await callback(Object.setPrototypeOf(row, Object.prototype))
  }
}

export default loadEvents
