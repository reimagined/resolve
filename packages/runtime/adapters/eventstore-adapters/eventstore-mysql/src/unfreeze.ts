import { AdapterPool } from './types'

const unfreeze = async ({
  connection,
  eventsTableName,
  escapeId,
}: AdapterPool): Promise<void> => {
  await connection.execute(
    `DROP TABLE ${escapeId(`${eventsTableName}-freeze`)}`
  )
}

export default unfreeze
