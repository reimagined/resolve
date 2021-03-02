import { AdapterPool } from './types'
import { EventstoreAlreadyFrozenError } from '@reimagined/eventstore-base'

const freeze = async ({
  database,
  eventsTableName,
  escapeId,
}: AdapterPool): Promise<void> => {
  try {
    await database.exec(
      `CREATE TABLE ${escapeId(`${eventsTableName}-freeze`)}(
      -- RESOLVE EVENT STORE ${escapeId(eventsTableName)} FREEZE MARKER
      ${escapeId('surrogate')} BIGINT NOT NULL,
      PRIMARY KEY(${escapeId('surrogate')})
    )`
    )
  } catch (error) {
    throw new EventstoreAlreadyFrozenError()
  }
}

export default freeze
