import { EventstoreResourceAlreadyExistError } from '@reimagined/eventstore-base'
import getLog from './get-log'
import { AdapterPool } from './types'
import {
  longNumberSqlType,
  longStringSqlType,
  customObjectSqlType,
  mediumBlobSqlType,
  longBlobSqlType,
  aggregateIdSqlType,
} from './constants'
import { isAlreadyExistsError } from './resource-errors'
import executeSequence from './execute-sequence'

const initEvents = async (pool: AdapterPool): Promise<any[]> => {
  const log = getLog('initEvents')
  log.debug('initializing events tables')
  const {
    eventsTableName,
    snapshotsTableName,
    escapeId,
    connection,
    database,
  } = pool

  const eventsTableNameAsId = escapeId(eventsTableName)
  const threadsTableNameAsId = escapeId(`${eventsTableName}-threads`)
  const snapshotsTableNameAsId = escapeId(snapshotsTableName)

  const statements: string[] = [
    `CREATE TABLE ${eventsTableNameAsId}(
      \`threadId\` ${longNumberSqlType},
      \`threadCounter\` ${longNumberSqlType},
      \`timestamp\` ${longNumberSqlType},
      \`aggregateId\` ${aggregateIdSqlType},
      \`aggregateVersion\` ${longNumberSqlType},
      \`type\` ${longStringSqlType},
      \`payload\` ${customObjectSqlType},
      PRIMARY KEY(\`threadId\`, \`threadCounter\`),
      UNIQUE KEY \`aggregate\`(\`aggregateId\`, \`aggregateVersion\`),
      INDEX USING BTREE(\`aggregateId\`),
      INDEX USING BTREE(\`aggregateVersion\`),
      INDEX USING BTREE(\`type\`),
      INDEX USING BTREE(\`timestamp\`)
    )`,
    `CREATE TABLE ${threadsTableNameAsId}(
      \`threadId\` ${longNumberSqlType},
      \`threadCounter\` ${longNumberSqlType},
      PRIMARY KEY(\`threadId\`)
    )`,
    `CREATE TABLE ${snapshotsTableNameAsId} (
      \`SnapshotKey\` ${mediumBlobSqlType},
      \`SnapshotContent\` ${longBlobSqlType},
      PRIMARY KEY(\`SnapshotKey\`(255))
    )`,
    `INSERT INTO ${threadsTableNameAsId}(
      \`threadId\`,
      \`threadCounter\`
    ) VALUES ${Array.from(new Array(256))
      .map((_, index) => `(${index}, 0)`)
      .join(',')}`,
  ]

  const errors: any[] = await executeSequence(
    connection,
    statements,
    log,
    (error) => {
      if (isAlreadyExistsError(error.message)) {
        return new EventstoreResourceAlreadyExistError(
          `duplicate initialization of the mysql adapter with same events database "${database}" and table "${eventsTableName}" is not allowed`
        )
      }
      return null
    }
  )

  log.debug('finished initializing events tables')
  return errors
}

export default initEvents
