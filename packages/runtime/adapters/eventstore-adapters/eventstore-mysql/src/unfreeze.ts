import { AdapterPool } from './types'

const unfreeze = async ({
  execute,
  eventsTableName,
  escapeId,
}: AdapterPool): Promise<void> => {
  await execute(`DROP TABLE ${escapeId(`${eventsTableName}-freeze`)}`)
}

export default unfreeze
