import { AdapterPool } from './types'

const rollbackIncrementalImport = async ({
  eventsTableName,
  query,
  escapeId,
}: AdapterPool): Promise<void> => {
  const incrementalImportTableAsId: string = escapeId(
    `${eventsTableName}-incremental-import`
  )
  await query(`DROP TABLE IF EXISTS ${incrementalImportTableAsId};`)
}

export default rollbackIncrementalImport
