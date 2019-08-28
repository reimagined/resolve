import {
  LONG_STRING_SQL_TYPE,
  LONG_NUMBER_SQL_TYPE,
  JSON_SQL_TYPE
} from './constants'

const init = async ({
  resourceOptions: { databaseName, tableName, userLogin, userPassword },
  executeStatement,
  escapeId,
  escape
}) => {
  await executeStatement(
    [
      `CREATE USER ${escapeId(userLogin)}`,
      `ALTER USER ${escapeId(userLogin)} PASSWORD ${escape(userPassword)}`,
      `CREATE SCHEMA ${escapeId(databaseName)}`,

      `CREATE TABLE ${escapeId(databaseName)}.${escapeId(tableName)}(
      ${escapeId('eventId')} ${LONG_NUMBER_SQL_TYPE} NOT NULL,
      ${escapeId('timestamp')} ${LONG_NUMBER_SQL_TYPE} NOT NULL,
      ${escapeId('aggregateId')} ${LONG_STRING_SQL_TYPE} NOT NULL,
      ${escapeId('aggregateVersion')} ${LONG_NUMBER_SQL_TYPE} NOT NULL,
      ${escapeId('type')} ${LONG_STRING_SQL_TYPE} NOT NULL,
      ${escapeId('payload')} ${JSON_SQL_TYPE},
      ${escapeId('eventSize')} ${LONG_NUMBER_SQL_TYPE} NOT NULL,
      PRIMARY KEY(${escapeId('eventId')})
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
        `${tableName}-sequence`
      )}(
      ${escapeId('key')} ${LONG_NUMBER_SQL_TYPE} NOT NULL,
      ${escapeId('eventId')} ${LONG_NUMBER_SQL_TYPE} NOT NULL,
      ${escapeId('timestamp')} ${LONG_NUMBER_SQL_TYPE} NOT NULL,
      ${escapeId('transactionId')} ${LONG_STRING_SQL_TYPE} NOT NULL,
      PRIMARY KEY(${escapeId('key')})
    )`,

      `INSERT INTO ${escapeId(databaseName)}.${escapeId(
        `${tableName}-sequence`
      )}(
      ${escapeId('key')},
      ${escapeId('eventId')},
      ${escapeId('timestamp')},
      ${escapeId('transactionId')}
    ) VALUES (
      0, 0, 0, ${escape('0')}
    )`,

      `GRANT USAGE ON SCHEMA ${escapeId(databaseName)} TO ${escapeId(
        userLogin
      )}`,

      `GRANT ALL ON SCHEMA ${escapeId(databaseName)} TO ${escapeId(userLogin)}`,

      `GRANT ALL ON ALL TABLES IN SCHEMA ${escapeId(
        databaseName
      )} TO ${escapeId(userLogin)}`,

      `GRANT ALL ON ALL SEQUENCES IN SCHEMA ${escapeId(
        databaseName
      )} TO ${escapeId(userLogin)}`,

      `GRANT ALL ON ALL FUNCTIONS IN SCHEMA ${escapeId(
        databaseName
      )} TO ${escapeId(userLogin)}`,

      `ALTER SCHEMA ${escapeId(databaseName)} OWNER TO ${escapeId(userLogin)}`
    ].join('; ')
  )
}

export default init
