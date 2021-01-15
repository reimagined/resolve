import { AdapterPool } from './types'

const unfreeze = async ({
  executeStatement,
  databaseName,
  eventsTableName,
  escapeId,
}: AdapterPool): Promise<void> => {
  const databaseNameAsId: string = escapeId(databaseName)
  const freezeTableNameAsId: string = escapeId(`${eventsTableName}-freeze`)

  await executeStatement(
    `DROP TABLE IF EXISTS ${databaseNameAsId}.${freezeTableNameAsId}`
  )
}

export default unfreeze
