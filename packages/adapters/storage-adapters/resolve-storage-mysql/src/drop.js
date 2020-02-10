const drop = async ({ tableName, connection, escapeId }) => {
  const eventsTableNameAsId = escapeId(tableName)
  const freezeTableNameAsId = escapeId(`${tableName}-freeze`)
  const threadsTableNameAsId = escapeId(`${tableName}-threads`)

  const statements = [
    `DROP TABLE IF EXISTS ${freezeTableNameAsId}`,
    `DROP TABLE ${threadsTableNameAsId}`,
    `DROP TABLE ${eventsTableNameAsId}`
  ]

  const errors = []

  for (const statement of statements) {
    try {
      await connection.execute(statement)
    } catch (error) {
      errors.push(error)
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.map(error => error.stack).join('\n'))
  }
}

export default drop
