import { EventstoreResourceNotExistError } from '@resolve-js/eventstore-base'
import { getLog } from './get-log'
import { AdapterPool } from './types'
import executeSequence from './execute-sequence'
import { isNotExistError } from './resource-errors'

const dropEvents = async ({
  databaseName,
  secretsTableName,
  eventsTableName,
  snapshotsTableName,
  subscribersTableName,
  executeStatement,
  escapeId,
}: AdapterPool): Promise<any[]> => {
  const log = getLog('dropEvents')

  log.debug(`dropping event tables`)
  log.verbose(`secretsTableName: ${secretsTableName}`)
  log.verbose(`databaseName: ${databaseName}`)

  const databaseNameAsId: string = escapeId(databaseName)

  const eventsTableNameAsId = escapeId(eventsTableName)
  const threadsTableNameAsId = escapeId(`${eventsTableName}-threads`)
  const freezeTableNameAsId = escapeId(`${eventsTableName}-freeze`)
  const snapshotsTableNameAsId = escapeId(snapshotsTableName)
  const incrementalImportTableAsId: string = escapeId(
    `${eventsTableName}-incremental-import`
  )

  const aggregateIdAndVersionIndexName = escapeId(
    `${eventsTableName}-aggregateIdAndVersion`
  )
  const aggregateIndexName = escapeId(`${eventsTableName}-aggregateId`)
  const aggregateVersionIndexName = escapeId(
    `${eventsTableName}-aggregateVersion`
  )
  const typeIndexName = escapeId(`${eventsTableName}-type`)
  const timestampIndexName = escapeId(`${eventsTableName}-timestamp`)
  const subscribersTableNameAsId = escapeId(subscribersTableName)

  const statements: string[] = [
    `DROP TABLE ${databaseNameAsId}.${eventsTableNameAsId}`,

    `DROP INDEX IF EXISTS ${databaseNameAsId}.${aggregateIdAndVersionIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${aggregateIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${aggregateVersionIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${typeIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${timestampIndexName}`,

    `DROP TABLE ${databaseNameAsId}.${threadsTableNameAsId}`,

    `DROP TABLE IF EXISTS ${databaseNameAsId}.${freezeTableNameAsId}`,

    `DROP TABLE ${databaseNameAsId}.${snapshotsTableNameAsId}`,
    `DROP TABLE IF EXISTS ${databaseNameAsId}.${incrementalImportTableAsId}`,

    `DROP TABLE ${databaseNameAsId}.${subscribersTableNameAsId}`,
  ]
  const errors: any[] = await executeSequence(
    executeStatement,
    statements,
    log,
    (error) => {
      if (isNotExistError(error)) {
        return new EventstoreResourceNotExistError(
          `postgresql adapter for database "${databaseName}" already dropped`
        )
      }
      return null
    }
  )

  log.debug(`finished dropping events tables`)
  return errors
}

export default dropEvents
