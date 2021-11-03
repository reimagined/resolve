import { ER_TABLE_EXISTS } from './constants'
import { AdapterPool } from './types'

const beginIncrementalImport = async ({
  eventsTableName,
  escapeId,
  escape,
  query,
}: AdapterPool): Promise<string> => {
  try {
    const incrementalImportTableAsId = escapeId(
      `${eventsTableName}-incremental-import`
    )
    const importId: string = Buffer.from(`${Date.now()}${Math.random()}`)
      .toString('base64')
      .replace(/\/|\+|=/gi, 'z')
    await query(
      `CREATE TABLE ${incrementalImportTableAsId}(
        ${escapeId('rowid')} VARCHAR(100) NOT NULL,
        ${escapeId('sortedIdx')} BIGINT NULL,
        ${escapeId('threadId')} BIGINT NULL,
        ${escapeId('threadCounter')} BIGINT NULL,
        ${escapeId('timestamp')} BIGINT NOT NULL,
        ${escapeId('aggregateId')} VARCHAR(700) NOT NULL,
        ${escapeId('aggregateVersion')} BIGINT NULL,
        ${escapeId('type')} VARCHAR(700) NOT NULL,
        ${escapeId('payload')} JSON NULL,
        PRIMARY KEY(${escapeId('rowid')})
      )
      COMMENT = ${escape(
        `RESOLVE INCREMENTAL-IMPORT ${escape(importId)} OWNED TABLE`
      )}
      ENGINE = "InnoDB";
      `
    )

    return importId
  } catch (error) {
    const errno = error != null && error.errno != null ? error.errno : 0
    if (errno === ER_TABLE_EXISTS) {
      throw new Error(`Previous incremental import is not finished`)
    } else {
      throw error
    }
  }
}

export default beginIncrementalImport
