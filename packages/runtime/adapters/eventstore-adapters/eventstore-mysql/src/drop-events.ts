import { EventstoreResourceNotExistError } from '@resolve-js/eventstore-base'
import { getLog } from './get-log'
import { AdapterPool } from './types'
import { isNotExistError } from './resource-errors'
import executeSequence from './execute-sequence'

const dropEvents = async (pool: AdapterPool): Promise<any[]> => {
  const log = getLog('dropEvents')

  const {
    eventsTableName,
    snapshotsTableName,
    subscribersTableName,
    connection,
    database,
    escapeId,
  } = pool

  log.debug(`dropping events`)
  log.verbose(`eventsTableName: ${eventsTableName}`)

  const eventsTableNameAsId: string = escapeId(eventsTableName)
  const freezeTableNameAsId: string = escapeId(`${eventsTableName}-freeze`)
  const threadsTableNameAsId: string = escapeId(`${eventsTableName}-threads`)
  const snapshotsTableNameAsId: string = escapeId(snapshotsTableName)
  const incrementalImportTableAsId = escapeId(
    `${eventsTableName}-incremental-import`
  )
  const subscribersTableNameAsId: string = escapeId(subscribersTableName)

  const statements: string[] = [
    `DROP TABLE IF EXISTS ${freezeTableNameAsId}`,
    `DROP TABLE ${threadsTableNameAsId}`,
    `DROP TABLE ${eventsTableNameAsId}`,
    `DROP TABLE ${snapshotsTableNameAsId}`,
    `DROP TABLE IF EXISTS ${incrementalImportTableAsId}`,
    `DROP TABLE ${subscribersTableNameAsId}`,
  ]

  const errors: any[] = await executeSequence(
    connection,
    statements,
    log,
    (error) => {
      if (isNotExistError(error)) {
        return new EventstoreResourceNotExistError(
          `mysql adapter for database "${database}" already dropped`
        )
      }
      return null
    }
  )

  log.debug(`finished dropping events`)
  return errors
}

export default dropEvents
