import { EventstoreResourceNotExistError } from 'resolve-eventstore-base'

const drop = async ({
  databaseName,
  eventsTableName,
  executeStatement,
  escapeId
}) => {
  const databaseNameAsId = escapeId(databaseName)
  const eventsTableNameAsId = escapeId(eventsTableName)
  const threadsTableNameAsId = escapeId(`${eventsTableName}-threads`)
  const freezeTableNameAsId = escapeId(`${eventsTableName}-freeze`)

  const aggregateIdAndVersionIndexName = escapeId(
    `${eventsTableName}-aggregateIdAndVersion`
  )
  const aggregateIndexName = escapeId(`${eventsTableName}-aggregateId`)
  const aggregateVersionIndexName = escapeId(`${eventsTableName}-aggregateVersion`)
  const typeIndexName = escapeId(`${eventsTableName}-type`)
  const timestampIndexName = escapeId(`${eventsTableName}-timestamp`)

  const statements = [
    `DROP TABLE ${databaseNameAsId}.${eventsTableNameAsId}`,

    `DROP INDEX IF EXISTS ${databaseNameAsId}.${aggregateIdAndVersionIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${aggregateIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${aggregateVersionIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${typeIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${timestampIndexName}`,

    `DROP TABLE ${databaseNameAsId}.${threadsTableNameAsId}`,

    `DROP TABLE IF EXISTS ${databaseNameAsId}.${freezeTableNameAsId}`
  ]
  const errors = []

  for (const statement of statements) {
    try {
      await executeStatement(statement)
    } catch (error) {
      if (error != null && /Table.*? does not exist$/i.test(error.message)) {
        throw new EventstoreResourceNotExistError(
          `Double-free eventstore-postgresql adapter via "${databaseName}" failed`
        )
      } else {
        errors.push(error)
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.map(error => error.stack).join('\n'))
  }
}

export default drop
