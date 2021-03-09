import { EventstoreResourceNotExistError } from '@resolve-js/eventstore-base'
import getLog from './get-log'
import { AdapterPool } from './types'
import { isNotExistError } from './resource-errors'
import executeSequence from './execute-sequence'

const dropEvents = async ({
  databaseName,
  eventsTableName,
  snapshotsTableName,
  subscribersTableName,
  executeStatement,
  escapeId,
}: AdapterPool): Promise<any[]> => {
  const log = getLog('dropEvents')

  log.debug(`dropping events tables`)
  log.verbose(`eventsTableName: ${eventsTableName}`)
  log.verbose(`databaseName: ${databaseName}`)

  const databaseNameAsId: string = escapeId(databaseName)

  const eventsTableNameAsId: string = escapeId(eventsTableName)
  const threadsTableNameAsId: string = escapeId(`${eventsTableName}-threads`)
  const freezeTableNameAsId: string = escapeId(`${eventsTableName}-freeze`)
  const snapshotsTableNameAsId: string = escapeId(snapshotsTableName)
  const incrementalImportTableAsId = escapeId(
    `${eventsTableName}-incremental-import`
  )
  const subscribersTableNameAsId: string = escapeId(subscribersTableName)

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
    `DROP TABLE ${databaseNameAsId}.${eventsTableNameAsId}`,

    `DROP INDEX IF EXISTS ${databaseNameAsId}.${aggregateIdAndVersionIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${aggregateIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${aggregateVersionIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${typeIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${timestampIndexName}`,

    `DROP TABLE ${databaseNameAsId}.${threadsTableNameAsId}`,

    `DROP TABLE ${databaseNameAsId}.${snapshotsTableNameAsId}`,

    `DROP TABLE IF EXISTS ${databaseNameAsId}.${freezeTableNameAsId}`,
    `DROP TABLE IF EXISTS ${databaseNameAsId}.${incrementalImportTableAsId}`,

    `DROP TABLE ${databaseNameAsId}.${subscribersTableNameAsId}`,
  ]
  const errors: any[] = await executeSequence(
    executeStatement,
    statements,
    log,
    (error) => {
      if (isNotExistError(error.message)) {
        return new EventstoreResourceNotExistError(
          `postgresql-serverless adapter for database "${databaseName}" already dropped`
        )
      }
      return null
    }
  )

  log.debug(`finished dropping events tables`)
  return errors
}

export default dropEvents
