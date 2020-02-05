import { EOL } from 'os'

const drop = async ({
  databaseName,
  tableName,
  executeStatement,
  escapeId
}) => {
  const databaseNameAsId = escapeId(databaseName)
  const eventsTableNameAsId = escapeId(tableName)
  const threadsTableNameAsId = escapeId(`${tableName}-threads`)
  const freezeTableNameAsId = escapeId(`${tableName}-freeze`)

  const statements = [
    `DROP TABLE ${databaseNameAsId}.${eventsTableNameAsId}`,

    `DROP INDEX ${databaseNameAsId}."aggregateIdAndVersion"`,
    `DROP INDEX ${databaseNameAsId}."aggregateId"`,
    `DROP INDEX ${databaseNameAsId}."aggregateVersion"`,
    `DROP INDEX ${databaseNameAsId}."type"`,
    `DROP INDEX ${databaseNameAsId}."timestamp"`,

    `DROP TABLE ${databaseNameAsId}.${threadsTableNameAsId}`,

    `DROP TABLE IF EXISTS ${databaseNameAsId}.${freezeTableNameAsId}`
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
    throw new Error(errors.map(error => error.stack).join(EOL))
  }
}

export default drop
