import { AdapterPool } from './types'

const unfreeze = async ({
  database,
  eventsTableName,
  escapeId,
}: AdapterPool): Promise<void> => {
  await database.exec(`DROP TABLE ${escapeId(`${eventsTableName}-freeze`)}`)
}

export default unfreeze
