import { AdapterPool } from './types'

const rollbackIncrementalImport = async ({
  database,
  eventsTableName,
  escapeId,
}: AdapterPool): Promise<void> => {
  const incrementalImportTableAsId = escapeId(
    `${eventsTableName}-incremental-import`
  )
  await database.exec(`DROP TABLE IF EXISTS ${incrementalImportTableAsId};`)
}

export default rollbackIncrementalImport
