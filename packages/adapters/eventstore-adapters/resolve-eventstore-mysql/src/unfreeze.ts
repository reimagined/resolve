import { AdapterPool } from './types'

const unfreeze = async ({
  connection,
  eventsTableName,
  escapeId,
}: AdapterPool): Promise<void> => {
  await connection.execute(
    `DROP TABLE IF EXISTS ${escapeId(`${eventsTableName}-freeze`)}`
  )
}

export default unfreeze
