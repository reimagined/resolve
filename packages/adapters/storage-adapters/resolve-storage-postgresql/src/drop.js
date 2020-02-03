const drop = async ({
  databaseName,
  tableName,
  executeStatement,
  escapeId
}) => {
  const statements = [
    `DROP TABLE ${escapeId(databaseName)}.${escapeId(tableName)}`,

    `DROP INDEX ${escapeId(databaseName)}.${escapeId('aggregateIdAndVersion')}`,
    `DROP INDEX ${escapeId(databaseName)}.${escapeId('aggregateId')}`,
    `DROP INDEX ${escapeId(databaseName)}.${escapeId('aggregateVersion')}`,
    `DROP INDEX ${escapeId(databaseName)}.${escapeId('type')}`,
    `DROP INDEX ${escapeId(databaseName)}.${escapeId('timestamp')}`,

    `DROP TABLE ${escapeId(databaseName)}.${escapeId(`${tableName}-threads`)}`,

    `DROP TABLE IF EXISTS ${escapeId(databaseName)}.${escapeId(
      `${tableName}-freeze`
    )}`
  ]
  const errors = []

  for (const statement of statements) {
    try {
      await executeStatement(statement)
    } catch (error) {
      errors.push(error)
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.map(error => error.stack).join('\n'))
  }
}

export default drop
