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

  const aggregateIdAndVersionIndexName = escapeId(
    `${tableName}-aggregateIdAndVersion`
  )
  const aggregateIndexName = escapeId(`${tableName}-aggregateId`)
  const aggregateVersionIndexName = escapeId(`${tableName}-aggregateVersion`)
  const typeIndexName = escapeId(`${tableName}-type`)
  const timestampIndexName = escapeId(`${tableName}-timestamp`)

  const statements = [
    `DROP TABLE ${databaseNameAsId}.${eventsTableNameAsId}`,

    `DROP INDEX ${databaseNameAsId}.${aggregateIdAndVersionIndexName}`,
    `DROP INDEX ${databaseNameAsId}.${aggregateIndexName}`,
    `DROP INDEX ${databaseNameAsId}.${aggregateVersionIndexName}`,
    `DROP INDEX ${databaseNameAsId}.${typeIndexName}`,
    `DROP INDEX ${databaseNameAsId}.${timestampIndexName}`,

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
