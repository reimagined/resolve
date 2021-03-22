import { AdapterPool } from './types'
import { EventstoreAlreadyUnfrozenError } from '@resolve-js/eventstore-base'
import { isNotExistError } from './resource-errors'

const unfreeze = async ({
  database,
  eventsTableName,
  escapeId,
}: AdapterPool): Promise<void> => {
  try {
    await database.exec(`DROP TABLE ${escapeId(`${eventsTableName}-freeze`)}`)
  } catch (error) {
    if (isNotExistError(error.message))
      throw new EventstoreAlreadyUnfrozenError()
    else throw error
  }
}

export default unfreeze
