import type { AdapterPool } from './types'
import type { EventStoreDescription } from '@resolve-js/eventstore-base'
import assert from 'assert'

const describe = async (pool: AdapterPool): Promise<EventStoreDescription> => {
  const { database, secretsTableName, escapeId, escape, eventsTableName } = pool

  const eventsTableNameAsId = escapeId(eventsTableName)
  const secretsTableNameAsId = escapeId(secretsTableName)
  const freezeTableName = `${eventsTableName}-freeze`

  const rows = await database.all(`SELECT
    (SELECT COUNT(*) FROM ${eventsTableNameAsId}) AS "eventCount",
    (SELECT COUNT(*) FROM ${secretsTableNameAsId}) AS "secretCount",
    (SELECT COUNT(*) FROM ${secretsTableNameAsId} WHERE "secret" IS NOT NULL) AS "setSecretCount",
    (SELECT COUNT(*) FROM ${secretsTableNameAsId} WHERE "secret" IS NULL) AS "deletedSecretCount", 
    (SELECT "timestamp" FROM ${eventsTableNameAsId} ORDER BY "timestamp" DESC LIMIT 1) AS "lastEventTimestamp",
    (SELECT EXISTS (SELECT * FROM "sqlite_master" WHERE "type" = 'table' AND "name" = ${escape(
      freezeTableName
    )})) AS "isFrozen"
    `)

  assert.strictEqual(rows.length, 1, 'Wrong number of description rows')
  const row = rows[0]
  return {
    eventCount: +row.eventCount,
    secretCount: +row.secretCount,
    setSecretCount: +row.setSecretCount,
    deletedSecretCount: +row.deletedSecretCount,
    lastEventTimestamp: +row.lastEventTimestamp,
    isFrozen: !!row.isFrozen,
  }
}

export default describe
