import { EventstoreResourceNotExistError } from '@resolve-js/eventstore-base'
import { getLog } from './get-log'
import { AdapterPool } from './types'
import executeSequence from './execute-sequence'
import { isNotExistError } from './resource-errors'

const dropEvents = async ({
  executeQuery,
  databaseFile,
  eventsTableName,
  snapshotsTableName,
  subscribersTableName,
  escapeId,
}: AdapterPool): Promise<any[]> => {
  const log = getLog('dropEvents')
  log.debug(`dropping events`)

  const incrementalImportTableAsId = escapeId(
    `${eventsTableName}-incremental-import`
  )

  const statements: string[] = [
    `DROP TABLE IF EXISTS ${escapeId(`${eventsTableName}-freeze`)}`,
    `DROP TABLE ${escapeId(eventsTableName)}`,
    `DROP TABLE ${escapeId(snapshotsTableName)}`,
    `DROP TABLE IF EXISTS ${incrementalImportTableAsId}`,
    `DROP TABLE ${escapeId(subscribersTableName)}`,
  ]

  const errors: any[] = await executeSequence(
    executeQuery,
    statements,
    log,
    (error) => {
      if (isNotExistError(error.message)) {
        return new EventstoreResourceNotExistError(
          `sqlite adapter for database "${databaseFile}" already dropped`
        )
      }
      return null
    }
  )

  log.debug(`finished dropping events`)
  return errors
}

export default dropEvents
