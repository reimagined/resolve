import { EventstoreResourceAlreadyExistError } from '@resolve-js/eventstore-base'
import { getLog } from './get-log'
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
    subscribersTableName,
    escapeId,
    database,
  } = pool

  const eventsTableNameAsId = escapeId(eventsTableName)
  const threadsTableNameAsId = escapeId(`${eventsTableName}-threads`)
  const snapshotsTableNameAsId = escapeId(snapshotsTableName)
  const subscribersTableNameAsId = escapeId(subscribersTableName)

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
    `CREATE TABLE ${subscribersTableNameAsId} (
      \`applicationName\` ${longStringSqlType},
      \`eventSubscriber\` ${longStringSqlType},
      \`destination\` ${customObjectSqlType},
      \`status\` ${customObjectSqlType},
      PRIMARY KEY(\`applicationName\`(127), \`eventSubscriber\`(127))
    )`,
  ]

  const errors: any[] = await executeSequence(
    pool,
    statements,
    log,
    (error) => {
      if (isAlreadyExistsError(error)) {
        return new EventstoreResourceAlreadyExistError(
          `duplicate initialization of the mysql adapter with same event database "${database}" and table "${eventsTableName}" is not allowed`
        )
      }
      return null
    }
  )

  log.debug('finished initializing events tables')
  return errors
}

export default initEvents
