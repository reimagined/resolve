import { AdapterPool } from './types'

const beginIncrementalImport = async ({
  eventsTableName,
  escapeId,
  escape,
  executeQuery,
}: AdapterPool): Promise<string> => {
  try {
    const incrementalImportTableAsId = escapeId(
      `${eventsTableName}-incremental-import`
    )
    const importId = Buffer.from(`${Date.now()}${Math.random()}`)
      .toString('base64')
      .replace(/\/|\+|=/gi, 'z')
    await executeQuery(
      `CREATE TABLE ${incrementalImportTableAsId}(
      -- RESOLVE INCREMENTAL-IMPORT ${escape(importId)} OWNED TABLE
        ${escapeId('threadId')} BIGINT NOT NULL,
        ${escapeId('threadCounter')} BIGINT NULL,
        ${escapeId('timestamp')} BIGINT NOT NULL,
        ${escapeId('aggregateId')} VARCHAR(700) NOT NULL,
        ${escapeId('aggregateVersion')} BIGINT NULL,
        ${escapeId('type')} VARCHAR(700) NOT NULL,
        ${escapeId('payload')} JSON NULL
      );
      `
    )

    return importId
  } catch (error) {
    if (
      error != null &&
      /^SQLITE_ERROR:.*? already exists$/.test(error.message)
    ) {
      throw new Error(`Previous incremental import is not finished`)
    } else {
      throw error
    }
  }
}

export default beginIncrementalImport
