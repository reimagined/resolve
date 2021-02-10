import { EventstoreResourceNotExistError } from 'resolve-eventstore-base'
import getLog from './get-log'
import { AdapterPool } from './types'
import executeSequence from './execute-sequence'
import { isNotExistError } from './resource-errors'

const dropEvents = async ({
  database,
  databaseFile,
  eventsTableName,
  snapshotsTableName,
  escapeId,
}: AdapterPool): Promise<any[]> => {
  const log = getLog('dropEvents')
  log.debug(`dropping events`)

  const statements: string[] = [
    `DROP TABLE IF EXISTS ${escapeId(`${eventsTableName}-freeze`)}`,
    `DROP TABLE ${escapeId(eventsTableName)}`,
    `DROP TABLE ${escapeId(snapshotsTableName)}`,
  ]

  const errors: any[] = await executeSequence(
    database,
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
