import {
  LONG_STRING_SQL_TYPE,
  LONG_NUMBER_SQL_TYPE,
  INT8_SQL_TYPE,
  JSON_SQL_TYPE
} from './constants'

const init = async ({
  databaseName,
  tableName,
  executeStatement,
  escapeId
}) => {
  await executeStatement(
    [
      `CREATE TABLE ${escapeId(databaseName)}.${escapeId(tableName)}(
      ${escapeId('threadId')} ${LONG_NUMBER_SQL_TYPE} NOT NULL,
      ${escapeId('threadCounter')} ${INT8_SQL_TYPE} NOT NULL,
      ${escapeId('timestamp')} ${LONG_NUMBER_SQL_TYPE} NOT NULL,
      ${escapeId('aggregateId')} ${LONG_STRING_SQL_TYPE} NOT NULL,
      ${escapeId('aggregateVersion')} ${LONG_NUMBER_SQL_TYPE} NOT NULL,
      ${escapeId('type')} ${LONG_STRING_SQL_TYPE} NOT NULL,
      ${escapeId('payload')} ${JSON_SQL_TYPE},
      ${escapeId('eventSize')} ${LONG_NUMBER_SQL_TYPE} NOT NULL,
      PRIMARY KEY(${escapeId('threadId')}, ${escapeId('threadCounter')})
    )`,
      `CREATE UNIQUE INDEX ${escapeId('aggregateIdAndVersion')}
     ON ${escapeId(databaseName)}.${escapeId(tableName)}
     USING BTREE(${escapeId('aggregateId')}, ${escapeId('aggregateVersion')})`,
      `CREATE INDEX ${escapeId('aggregateId')}
     ON ${escapeId(databaseName)}.${escapeId(tableName)}
     USING BTREE(${escapeId('aggregateId')})`,
      `CREATE INDEX ${escapeId('aggregateVersion')}
     ON ${escapeId(databaseName)}.${escapeId(tableName)}
     USING BTREE(${escapeId('aggregateVersion')})`,
      `CREATE INDEX ${escapeId('type')}
     ON ${escapeId(databaseName)}.${escapeId(tableName)}
     USING BTREE(${escapeId('type')})`,
      `CREATE INDEX ${escapeId('timestamp')}
     ON ${escapeId(databaseName)}.${escapeId(tableName)}
     USING BTREE(${escapeId('timestamp')})`,

      `CREATE TABLE ${escapeId(databaseName)}.${escapeId(
        `${tableName}-threads`
      )}(
      ${escapeId('threadId')} ${LONG_NUMBER_SQL_TYPE} NOT NULL,
      ${escapeId('threadCounter')} ${LONG_NUMBER_SQL_TYPE} NOT NULL,
      PRIMARY KEY(${escapeId('threadId')})
    )`,

      `INSERT INTO ${escapeId(databaseName)}.${escapeId(
        `${tableName}-threads`
      )}(
      ${escapeId('threadId')},
      ${escapeId('threadCounter')}
    ) VALUES ${Array.from(new Array(256))
      .map((_, index) => `(${index}, 0)`)
      .join(',')}`
    ].join('; '),
    false
  )
}

export default init
