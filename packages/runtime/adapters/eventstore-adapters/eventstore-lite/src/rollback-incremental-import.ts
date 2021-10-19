import { AdapterPool } from './types'

const rollbackIncrementalImport = async ({
  executeQuery,
  eventsTableName,
  escapeId,
}: AdapterPool): Promise<void> => {
  const incrementalImportTableAsId = escapeId(
    `${eventsTableName}-incremental-import`
  )
  await executeQuery(`DROP TABLE IF EXISTS ${incrementalImportTableAsId};`)
}

export default rollbackIncrementalImport
