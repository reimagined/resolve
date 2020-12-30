import { EOL } from 'os'
import { EventstoreResourceNotExistError } from 'resolve-eventstore-base'
import getLog from './get-log'
import { AdapterPool } from './types'

const drop = async ({
  databaseName,
  eventsTableName,
  snapshotsTableName,
  executeStatement,
  escapeId,
  secretsTableName,
}: AdapterPool): Promise<void> => {
  const log = getLog('dropSecretsStore')

  log.debug(`dropping secrets store database tables`)
  log.verbose(`secretsTableName: ${secretsTableName}`)
  log.verbose(`databaseName: ${databaseName}`)

  const secretsTableNameAsId: string = escapeId(secretsTableName)
  const globalIndexName: string = escapeId(`${secretsTableName}-global`)
  const databaseNameAsId: string = escapeId(databaseName)

  log.debug(`secrets store database tables and indices are dropped`)

  const eventsTableNameAsId: string = escapeId(eventsTableName)
  const threadsTableNameAsId: string = escapeId(`${eventsTableName}-threads`)
  const freezeTableNameAsId: string = escapeId(`${eventsTableName}-freeze`)
  const snapshotsTableNameAsId: string = escapeId(snapshotsTableName)

  const aggregateIdAndVersionIndexName: string = escapeId(
    `${eventsTableName}-aggregateIdAndVersion`
  )
  const aggregateIndexName: string = escapeId(`${eventsTableName}-aggregateId`)
  const aggregateVersionIndexName: string = escapeId(
    `${eventsTableName}-aggregateVersion`
  )
  const typeIndexName: string = escapeId(`${eventsTableName}-type`)
  const timestampIndexName: string = escapeId(`${eventsTableName}-timestamp`)

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

    `DROP TABLE ${databaseNameAsId}.${snapshotsTableNameAsId}`,

    `DROP TABLE IF EXISTS ${databaseNameAsId}.${freezeTableNameAsId}`,
  ]
  const errors: any[] = []

  for (const statement of statements) {
    try {
      log.debug(`executing query`)
      log.verbose(statement)
      await executeStatement(statement)
      log.debug(`query executed successfully`)
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
    throw new Error(errors.map((error) => error.stack).join(EOL))
  }

  log.debug(`the event store dropped`)
}

export default drop
