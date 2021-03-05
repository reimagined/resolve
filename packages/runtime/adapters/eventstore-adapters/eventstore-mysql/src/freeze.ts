import { AdapterPool } from './types'

const freeze = async ({
  connection,
  eventsTableName,
  escapeId,
}: AdapterPool): Promise<void> => {
  await connection.execute(
    `CREATE TABLE ${escapeId(`${eventsTableName}-freeze`)}(
      ${escapeId('surrogate')} BIGINT NOT NULL,
      PRIMARY KEY(${escapeId('surrogate')})
    )
    COMMENT = "RESOLVE EVENT STORE ${escapeId(eventsTableName)} FREEZE MARKER" 
    `
  )
}

export default freeze
