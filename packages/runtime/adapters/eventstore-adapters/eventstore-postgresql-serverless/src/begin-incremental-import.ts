import {
  LONG_STRING_SQL_TYPE,
  LONG_NUMBER_SQL_TYPE,
  INT8_SQL_TYPE,
  JSON_SQL_TYPE,
  BIG_SERIAL,
} from './constants'
import { AdapterPool } from './types'

const beginIncrementalImport = async ({
  executeStatement,
  databaseName,
  eventsTableName,
  escapeId,
  escape,
}: AdapterPool): Promise<string> => {
  try {
    const databaseNameAsId = escapeId(databaseName)
    const incrementalImportTableAsId = escapeId(
      `${eventsTableName}-incremental-import`
    )
    const importId = Buffer.from(`${Date.now()}${Math.random()}`)
      .toString('base64')
      .replace(/\/|\+|=/gi, 'z')
    await executeStatement(
      `CREATE TABLE ${databaseNameAsId}.${incrementalImportTableAsId}(
        "sortedIdx" ${LONG_NUMBER_SQL_TYPE} NULL,
        "rowid" ${BIG_SERIAL},
        "threadId" ${LONG_NUMBER_SQL_TYPE} NULL,
        "threadCounter" ${INT8_SQL_TYPE} NULL,
        "timestamp" ${LONG_NUMBER_SQL_TYPE} NOT NULL,
        "aggregateId" ${LONG_STRING_SQL_TYPE} NOT NULL,
        "aggregateVersion" ${LONG_NUMBER_SQL_TYPE} NULL,
        "type" ${LONG_STRING_SQL_TYPE} NOT NULL,
        "payload" ${JSON_SQL_TYPE},
        "eventSize" ${LONG_NUMBER_SQL_TYPE} NOT NULL
      );
      
      COMMENT ON TABLE ${databaseNameAsId}.${incrementalImportTableAsId}
      IS ${escape(
        `RESOLVE INCREMENTAL-IMPORT ${escape(importId)} OWNED TABLE`
      )};
      `
    )

    return importId
  } catch (error) {
    if (error != null && /Relation.*? already exists$/i.test(error.message)) {
      throw new Error(`Previous incremental import is not finished`)
    } else {
      throw error
    }
  }
}

export default beginIncrementalImport
