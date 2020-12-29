import { AdapterPool } from './types'

const rollbackIncrementalImport = async ({
  eventsTableName,
  connection,
  escapeId,
}: AdapterPool): Promise<void> => {
  const incrementalImportTableAsId: string = escapeId(
    `${eventsTableName}-incremental-import`
  )
  await connection.query(`DROP TABLE IF EXISTS ${incrementalImportTableAsId};`)
}

export default rollbackIncrementalImport
