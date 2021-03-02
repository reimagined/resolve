import { AdapterPool } from './types'

const rollbackIncrementalImport = async ({
  executeStatement,
  databaseName,
  eventsTableName,
  escapeId,
}: AdapterPool): Promise<void> => {
  const databaseNameAsId: string = escapeId(databaseName)
  const incrementalImportTableAsId: string = escapeId(
    `${eventsTableName}-incremental-import`
  )
  await executeStatement(
    `DROP TABLE IF EXISTS ${databaseNameAsId}.${incrementalImportTableAsId};`
  )
}

export default rollbackIncrementalImport
