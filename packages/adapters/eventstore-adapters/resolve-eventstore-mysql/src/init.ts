import { EventstoreResourceAlreadyExistError } from 'resolve-eventstore-base'
import getLog from './get-log'
import { AdapterPool } from './types'
import {
  longNumberSqlType,
  longStringSqlType,
  customObjectSqlType,
  mediumBlobSqlType,
  longBlobSqlType,
  aggregateIdSqlType,
  ER_TABLE_EXISTS,
  ER_NO_SUCH_TABLE,
  ER_DUP_ENTRY,
  ER_LOCK_DEADLOCK,
  ER_SUBQUERY_NO_1_ROW
} from './constants'

const init = async (pool: AdapterPool): Promise<any> => {
  const log = getLog('init')
  log.debug('initializing databases')
  const {
    eventsTableName,
    snapshotsTableName,
    secretsTableName,
    escapeId,
    connection,
    database,
  } = pool

  const eventsTableNameAsId = escapeId(eventsTableName)
  const threadsTableNameAsId = escapeId(`${eventsTableName}-threads`)
  const snapshotsTableNameAsId = escapeId(snapshotsTableName)
  const secretsTableNameAsId = escapeId(secretsTableName)

  log.debug(`building a query`)
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
    `CREATE TABLE ${secretsTableNameAsId}(
      \`idx\` ${longNumberSqlType},
      \`id\` ${aggregateIdSqlType},
      \`secret\` ${longStringSqlType},
      PRIMARY KEY(\`id\`, \`idx\`)
    )`,
  ]

  const errors: any[] = []

  for (const statement of statements) {
    try {
      log.debug(`executing query`)
      log.verbose(statement)
      await connection.query(statement)
      log.debug(`query executed successfully`)
    } catch (error) {
      if (error) {
        let errorToThrow = error
        if (Number(errorToThrow) === ER_TABLE_EXISTS || ER_NO_SUCH_TABLE || ER_DUP_ENTRY || ER_LOCK_DEADLOCK || ER_SUBQUERY_NO_1_ROW) {
          errorToThrow = new EventstoreResourceAlreadyExistError(
            `duplicate initialization of the mysql adapter with same events database "${database}" and table "${eventsTableName}" not allowed`
          )
        } else {
          log.error(errorToThrow.message)
          log.verbose(errorToThrow.stack)
        }
        errors.push(errorToThrow)
      }
    }
  }

  pool.maybeThrowResourceError(errors)

  log.debug('databases are initialized')
}

export default init
