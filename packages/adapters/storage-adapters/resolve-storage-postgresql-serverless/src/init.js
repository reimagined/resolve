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
  const databaseNameAsId = escapeId(databaseName)
  const eventsTableNameAsId = escapeId(tableName)
  const threadsTableNameAsId = escapeId(`${tableName}-threads`)

  const aggregateIdAndVersionIndexName = escapeId(
    `${tableName}-aggregateIdAndVersion`
  )
  const aggregateIndexName = escapeId(`${tableName}-aggregateId`)
  const aggregateVersionIndexName = escapeId(`${tableName}-aggregateVersion`)
  const typeIndexName = escapeId(`${tableName}-type`)
  const timestampIndexName = escapeId(`${tableName}-timestamp`)

  await executeStatement(
    `CREATE TABLE ${databaseNameAsId}.${eventsTableNameAsId}(
      "threadId" ${LONG_NUMBER_SQL_TYPE} NOT NULL,
      "threadCounter" ${INT8_SQL_TYPE} NOT NULL,
      "timestamp" ${LONG_NUMBER_SQL_TYPE} NOT NULL,
      "aggregateId" ${LONG_STRING_SQL_TYPE} NOT NULL,
      "aggregateVersion" ${LONG_NUMBER_SQL_TYPE} NOT NULL,
      "type" ${LONG_STRING_SQL_TYPE} NOT NULL,
      "payload" ${JSON_SQL_TYPE},
      "eventSize" ${LONG_NUMBER_SQL_TYPE} NOT NULL,
      PRIMARY KEY("threadId", "threadCounter")
    );
    
    CREATE UNIQUE INDEX ${aggregateIdAndVersionIndexName}
    ON ${databaseNameAsId}.${eventsTableNameAsId}
    USING BTREE("aggregateId", "aggregateVersion");
     
    CREATE INDEX ${aggregateIndexName}
    ON ${databaseNameAsId}.${eventsTableNameAsId}
    USING BTREE("aggregateId");
     
    CREATE INDEX ${aggregateVersionIndexName}
    ON ${databaseNameAsId}.${eventsTableNameAsId}
    USING BTREE("aggregateVersion");
     
    CREATE INDEX ${typeIndexName}
    ON ${databaseNameAsId}.${eventsTableNameAsId}
    USING BTREE("type");
     
    CREATE INDEX ${timestampIndexName}
    ON ${databaseNameAsId}.${eventsTableNameAsId}
    USING BTREE("timestamp");
     
    CREATE TABLE ${databaseNameAsId}.${threadsTableNameAsId}(
      "threadId" ${LONG_NUMBER_SQL_TYPE} NOT NULL,
      "threadCounter" ${LONG_NUMBER_SQL_TYPE} NOT NULL,
     PRIMARY KEY("threadId")
    );

    INSERT INTO ${databaseNameAsId}.${threadsTableNameAsId}(
      "threadId",
      "threadCounter"
    ) VALUES ${Array.from(new Array(256))
      .map((_, index) => `(${index}, 0)`)
      .join(',')}
    ;`
  )
}

export default init
