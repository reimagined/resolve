import { EOL } from 'os'
import { EventstoreResourceNotExistError } from 'resolve-eventstore-base'
import getLog from './get-log'

const drop = async ({
  databaseName,
  tableName,
  executeStatement,
  escapeId
}) => {
  const log = getLog(`dropEventStore`)

  const databaseNameAsId = escapeId(databaseName)
  const eventsTableNameAsId = escapeId(tableName)
  const threadsTableNameAsId = escapeId(`${tableName}-threads`)
  const freezeTableNameAsId = escapeId(`${tableName}-freeze`)
  const snapshotsTableNameAsId = escapeId(`${tableName}-snapshots`)

  const aggregateIdAndVersionIndexName = escapeId(
    `${tableName}-aggregateIdAndVersion`
  )
  const aggregateIndexName = escapeId(`${tableName}-aggregateId`)
  const aggregateVersionIndexName = escapeId(`${tableName}-aggregateVersion`)
  const typeIndexName = escapeId(`${tableName}-type`)
  const timestampIndexName = escapeId(`${tableName}-timestamp`)

  const statements = [
    `DROP TABLE ${databaseNameAsId}.${eventsTableNameAsId}`,

    `DROP INDEX IF EXISTS ${databaseNameAsId}.${aggregateIdAndVersionIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${aggregateIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${aggregateVersionIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${typeIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${timestampIndexName}`,

    `DROP TABLE ${databaseNameAsId}.${threadsTableNameAsId}`,

    `DROP TABLE ${databaseNameAsId}.${snapshotsTableNameAsId}`,

    `DROP TABLE IF EXISTS ${databaseNameAsId}.${freezeTableNameAsId}`
  ]
  const errors = []

  for (const statement of statements) {
    try {
      await executeStatement(statement)
    } catch (error) {
      if (error != null) {
        if (/Table.*? does not exist$/i.test(error.message)) {
          throw new EventstoreResourceNotExistError(
            `duplicate event store resource drop detected`
          )
        } else {
          log.error(error.message)
          log.verbose(error.stack)
        }
        errors.push(error)
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.map(error => error.stack).join(EOL))
  }
}

export default drop
