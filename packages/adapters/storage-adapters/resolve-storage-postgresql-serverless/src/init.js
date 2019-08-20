const longStringSqlType = 'VARCHAR(190) NOT NULL'
const longNumberSqlType = 'BIGINT NOT NULL'
const jsonType = 'jsonb'

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
      ${escapeId('eventId')} ${longNumberSqlType},
      ${escapeId('timestamp')} ${longNumberSqlType},
      ${escapeId('aggregateId')} ${longStringSqlType},
      ${escapeId('aggregateVersion')} ${longNumberSqlType},
      ${escapeId('type')} ${longStringSqlType},
      ${escapeId('payload')} ${jsonType},
      ${escapeId('eventSize')} ${longNumberSqlType},
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
      ${escapeId('key')} ${longNumberSqlType},
      ${escapeId('eventId')} ${longNumberSqlType},
      ${escapeId('timestamp')} ${longNumberSqlType},
      ${escapeId('transactionId')} ${longStringSqlType},
      PRIMARY KEY(${escapeId('key')})
    )`,

      // streamId expireTime

      `CREATE TABLE ${escapeId(databaseName)}.${escapeId(
        `${tableName}-sequence`
      )}(
      ${escapeId('key')} ${longNumberSqlType},
      ${escapeId('eventId')} ${longNumberSqlType},
      ${escapeId('timestamp')} ${longNumberSqlType},
      ${escapeId('transactionId')} ${longStringSqlType},
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
