import type { AdapterPool } from './types'
import type { EventStoreDescription } from '@resolve-js/eventstore-base'
import assert from 'assert'

const describe = async (pool: AdapterPool): Promise<EventStoreDescription> => {
  const {
    executeStatement,
    secretsTableName,
    escapeId,
    escape,
    eventsTableName,
    databaseName,
  } = pool

  const databaseNameAsId: string = escapeId(databaseName)
  const eventsTableNameAsId = escapeId(eventsTableName)
  const secretsTableNameAsId = escapeId(secretsTableName)
  const freezeTableName = `${eventsTableName}-freeze`

  const rows = await executeStatement(`SELECT
    (SELECT COUNT(*) FROM ${databaseNameAsId}.${eventsTableNameAsId}) AS "eventCount",
    (SELECT COUNT(*) FROM ${databaseNameAsId}.${secretsTableNameAsId}) AS "secretCount",
    (SELECT COUNT(*) FROM ${databaseNameAsId}.${secretsTableNameAsId} WHERE "secret" IS NOT NULL) AS "setSecretCount",
    (SELECT COUNT(*) FROM ${databaseNameAsId}.${secretsTableNameAsId} WHERE "secret" IS NULL) AS "deletedSecretCount", 
    (SELECT "timestamp" FROM ${databaseNameAsId}.${eventsTableNameAsId} ORDER BY "timestamp" DESC LIMIT 1) AS "lastEventTimestamp",
    (SELECT EXISTS (SELECT FROM "information_schema"."tables" WHERE "table_schema" = ${escape(
      databaseName
    )} AND "table_name" = ${escape(freezeTableName)})) AS "isFrozen"
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
