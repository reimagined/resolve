import { AdapterPool } from './types'

const unfreeze = async ({
  database,
  eventsTableName,
  escapeId,
}: AdapterPool): Promise<void> => {
  await database.exec(
    `DROP TABLE IF EXISTS ${escapeId(`${eventsTableName}-freeze`)}`
  )
}

export default unfreeze
