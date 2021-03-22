import { AdapterPool } from './types'
import { EventstoreAlreadyUnfrozenError } from '@resolve-js/eventstore-base'
import { isNotExistError } from './resource-errors'

const unfreeze = async ({
  executeStatement,
  databaseName,
  eventsTableName,
  escapeId,
}: AdapterPool): Promise<void> => {
  const databaseNameAsId = escapeId(databaseName)
  const freezeTableNameAsId = escapeId(`${eventsTableName}-freeze`)

  try {
    await executeStatement(
      `DROP TABLE ${databaseNameAsId}.${freezeTableNameAsId}`
    )
  } catch (error) {
    if (isNotExistError(error)) throw new EventstoreAlreadyUnfrozenError()
    else throw error
  }
}

export default unfreeze
