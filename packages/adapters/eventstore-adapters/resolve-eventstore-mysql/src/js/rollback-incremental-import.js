import { ER_NO_SUCH_TABLE } from './constants'

const rollbackIncrementalImport = async ({
  events: { eventsTableName, connection },
  escapeId
}) => {
  try {
    const incrementalImportTableAsId = escapeId(
      `${eventsTableName}-incremental-import`
    )
    await connection.query(`DROP TABLE ${incrementalImportTableAsId};`)
  } catch (error) {
    const errno = error != null && error.errno != null ? error.errno : 0

    if (errno === ER_NO_SUCH_TABLE) {
      throw new Error(`Previous incremental import does not exist`)
    } else {
      throw error
    }
  }
}

export default rollbackIncrementalImport
