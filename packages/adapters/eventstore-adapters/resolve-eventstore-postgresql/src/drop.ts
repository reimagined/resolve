import { EventstoreResourceNotExistError } from 'resolve-eventstore-base'
import getLog from './get-log'
import { AdapterPool } from './types'
const drop = async ({
  databaseName,
  secretsTableName,
  eventsTableName,
  snapshotsTableName,
  executeStatement,
  escapeId,
  monitoring,
}: AdapterPool): Promise<void> => {
  const log = getLog('dropSecretsStore')

  log.debug(`dropping secrets store database tables and indices`)
  log.verbose(`secretsTableName: ${secretsTableName}`)
  log.verbose(`databaseName: ${databaseName}`)

  const databaseNameAsId: string = escapeId(databaseName)
  const secretsTableNameAsId: string = escapeId(secretsTableName)
  const globalIndexName: string = escapeId(`${secretsTableName}-global`)

  const eventsTableNameAsId = escapeId(eventsTableName)
  const threadsTableNameAsId = escapeId(`${eventsTableName}-threads`)
  const freezeTableNameAsId = escapeId(`${eventsTableName}-freeze`)
  const snapshotsTableNameAsId = escapeId(snapshotsTableName)

  const aggregateIdAndVersionIndexName = escapeId(
    `${eventsTableName}-aggregateIdAndVersion`
  )
  const aggregateIndexName = escapeId(`${eventsTableName}-aggregateId`)
  const aggregateVersionIndexName = escapeId(
    `${eventsTableName}-aggregateVersion`
  )
  const typeIndexName = escapeId(`${eventsTableName}-type`)
  const timestampIndexName = escapeId(`${eventsTableName}-timestamp`)

  const statements: string[] = [
    `DROP TABLE ${databaseNameAsId}.${secretsTableNameAsId}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${globalIndexName}`,

    `DROP TABLE ${databaseNameAsId}.${eventsTableNameAsId}`,

    `DROP INDEX IF EXISTS ${databaseNameAsId}.${aggregateIdAndVersionIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${aggregateIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${aggregateVersionIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${typeIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${timestampIndexName}`,

    `DROP TABLE ${databaseNameAsId}.${threadsTableNameAsId}`,

    `DROP TABLE IF EXISTS ${databaseNameAsId}.${freezeTableNameAsId}`,

    `DROP TABLE ${databaseNameAsId}.${snapshotsTableNameAsId}`,
  ]
  const errors: any[] = []

  for (const statement of statements) {
    try {
      log.debug(`executing query`)
      log.verbose(statement)
      await executeStatement(statement)
      log.debug(`query executed successfully`)
    } catch (error) {
      if (error != null && `${error.code}` === '42P01') {
        throw new EventstoreResourceNotExistError(
          `duplicate event store resource drop detected`
        )
      } else {
        errors.push(error)
      }
    }
  }

  monitoring(errors)

  log.debug(`the event store dropped`)
}

export default drop
