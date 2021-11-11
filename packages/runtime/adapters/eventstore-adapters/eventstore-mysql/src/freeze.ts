import { AdapterPool } from './types'

const freeze = async ({
  execute,
  eventsTableName,
  escapeId,
}: AdapterPool): Promise<void> => {
  await execute(
    `CREATE TABLE ${escapeId(`${eventsTableName}-freeze`)}(
      ${escapeId('surrogate')} BIGINT NOT NULL,
      PRIMARY KEY(${escapeId('surrogate')})
    )
    COMMENT = "RESOLVE EVENT STORE ${escapeId(eventsTableName)} FREEZE MARKER" 
    `
  )
}

export default freeze
