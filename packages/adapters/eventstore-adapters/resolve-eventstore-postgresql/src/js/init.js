import { EventstoreResourceAlreadyExistError } from 'resolve-eventstore-base'

import {
  LONG_STRING_SQL_TYPE,
  LONG_NUMBER_SQL_TYPE,
  INT8_SQL_TYPE,
  JSON_SQL_TYPE
} from './constants'

const init = async ({
  databaseName,
  eventsTableName,
  executeStatement,
  escapeId
}) => {
  const databaseNameAsId = escapeId(databaseName)
  const eventsTableNameAsId = escapeId(eventsTableName)
  const threadsTableNameAsId = escapeId(`${eventsTableName}-threads`)

  const aggregateIdAndVersionIndexName = escapeId(
    `${eventsTableName}-aggregateIdAndVersion`
  )
  const aggregateIndexName = escapeId(`${eventsTableName}-aggregateId`)
  const aggregateVersionIndexName = escapeId(`${eventsTableName}-aggregateVersion`)
  const typeIndexName = escapeId(`${eventsTableName}-type`)
  const timestampIndexName = escapeId(`${eventsTableName}-timestamp`)

  try {
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
  } catch (error) {
    if (error != null && /Relation.*? already exists$/i.test(error.message)) {
      throw new EventstoreResourceAlreadyExistError(
        `Double-initialize storage-postgresql adapter via "${databaseName}" failed`
      )
    } else {
      throw error
    }
  }
}

export default init
