import { AdapterPool } from './types'
import { EventstoreAlreadyFrozenError } from '@resolve-js/eventstore-base'
import { isAlreadyExistsError } from './resource-errors'

const freeze = async ({
  executeQuery,
  eventsTableName,
  escapeId,
}: AdapterPool): Promise<void> => {
  try {
    await executeQuery(
      `CREATE TABLE ${escapeId(`${eventsTableName}-freeze`)}(
      -- RESOLVE EVENT STORE ${escapeId(eventsTableName)} FREEZE MARKER
      ${escapeId('surrogate')} BIGINT NOT NULL,
      PRIMARY KEY(${escapeId('surrogate')})
    )`
    )
  } catch (error) {
    if (isAlreadyExistsError(error.message))
      throw new EventstoreAlreadyFrozenError()
    else throw error
  }
}

export default freeze
