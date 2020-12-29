import { EOL } from 'os'
import { EventstoreResourceNotExistError } from 'resolve-eventstore-base'
import getLog from './get-log'
import { AdapterPool } from './types'
const drop = async ({
  databaseName,
  secretsTableName,
  eventsTableName,
  snapshotsTableName,
  executeStatement,
  escapeId,
}: AdapterPool): Promise<void> => {
  const log = getLog('dropSecretsStore')

  log.debug(`dropping secrets store database tables`)
  log.verbose(`secretsTableName: ${secretsTableName}`)

  log.debug(`dropping secrets store database tables and indices`)
  log.verbose(`secretsTableName: ${secretsTableName}`)
  log.verbose(`databaseName: ${databaseName}`)

  const databaseNameAsId: string = escapeId(databaseName)
  const secretsTableNameAsId: string = escapeId(secretsTableName)
  const globalIndexName: string = escapeId(`${secretsTableName}-global`)

  let statements = [
    `DROP TABLE ${databaseNameAsId}.${secretsTableNameAsId}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${globalIndexName}`,
  ]

  let errors = []

  for (const statement of statements) {
    try {
      await executeStatement(statement)
    } catch (error) {
      if (error != null) {
        log.error(error.message)
        log.verbose(error.stack)
        if (`${error.code}` === '42P01') {
          throw new EventstoreResourceNotExistError(
            `duplicate event store resource drop detected`
          )
        }
        errors.push(error)
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.stack).join(EOL))
  }

  log.debug(`secrets store database tables and indices are dropped`)

  const eventsTableNameAsId = escapeId(eventsTableName)
  const threadsTableNameAsId = escapeId(`${eventsTableName}-threads`)
  const freezeTableNameAsId = escapeId(`${eventsTableName}-freeze`)
  const snapshotsTableNameAsId = escapeId(snapshotsTableName)

  const aggregateIdAndVersionIndexName = escapeId(
    `${eventsTableName}-aggregateIdAndVersion`
  )
  const aggregateIndexName = escapeId(`${eventsTableName}-aggregateId`)
  const aggregateVersionIndexName = escapeId(
    `${eventsTableName}-aggregateVersion`
  )
  const typeIndexName = escapeId(`${eventsTableName}-type`)
  const timestampIndexName = escapeId(`${eventsTableName}-timestamp`)

  statements = [
    `DROP TABLE ${databaseNameAsId}.${eventsTableNameAsId}`,

    `DROP INDEX IF EXISTS ${databaseNameAsId}.${aggregateIdAndVersionIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${aggregateIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${aggregateVersionIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${typeIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${timestampIndexName}`,

    `DROP TABLE ${databaseNameAsId}.${threadsTableNameAsId}`,

    `DROP TABLE IF EXISTS ${databaseNameAsId}.${freezeTableNameAsId}`,

    `DROP TABLE ${databaseNameAsId}.${snapshotsTableNameAsId}`,
  ]
  errors = []

  for (const statement of statements) {
    try {
      await executeStatement(statement)
    } catch (error) {
      if (error != null && `${error.code}` === '42P01') {
        throw new EventstoreResourceNotExistError(
          `Double-free eventstore-postgresql adapter via "${databaseName}" failed`
        )
      } else {
        errors.push(error)
      }
    }
  }

  if (errors.length > 0) {
    const error: any = new Error()
    error.message = errors.map(({ message }) => message).join(EOL)
    error.stack = errors.map(({ stack }) => stack).join(EOL)

    const errorCodes = new Set(
      errors.map(({ code }) => code).filter((code) => code != null)
    )
    if (errorCodes.size === 1) {
      error.code = [...errorCodes][0]
    }

    throw error
  }
}

export default drop
