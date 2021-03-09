import { AdapterPool } from './types'

const rollbackIncrementalImport = async ({
  executeStatement,
  databaseName,
  eventsTableName,
  escapeId,
}: AdapterPool): Promise<void> => {
  const databaseNameAsId = escapeId(databaseName)
  const incrementalImportTableAsId = escapeId(
    `${eventsTableName}-incremental-import`
  )
  await executeStatement(
    `DROP TABLE IF EXISTS ${databaseNameAsId}.${incrementalImportTableAsId};`
  )
}

export default rollbackIncrementalImport
