import { AdapterPool } from './types'
import { EventstoreAlreadyUnfrozenError } from 'resolve-eventstore-base'

const unfreeze = async ({
  database,
  eventsTableName,
  escapeId,
}: AdapterPool): Promise<void> => {
  try {
    await database.exec(`DROP TABLE ${escapeId(`${eventsTableName}-freeze`)}`)
  } catch (error) {
    throw new EventstoreAlreadyUnfrozenError()
  }
}

export default unfreeze
