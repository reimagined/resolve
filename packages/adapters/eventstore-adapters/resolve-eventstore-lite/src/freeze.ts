import { AdapterPool } from './types'

const freeze = async ({
  database,
  eventsTableName,
  escapeId,
}: AdapterPool): Promise<void> => {
  await database.exec(
    `CREATE TABLE IF NOT EXISTS ${escapeId(`${eventsTableName}-freeze`)}(
      -- RESOLVE EVENT STORE ${escapeId(eventsTableName)} FREEZE MARKER
      ${escapeId('surrogate')} BIGINT NOT NULL,
      PRIMARY KEY(${escapeId('surrogate')})
    )`
  )
}

export default freeze
