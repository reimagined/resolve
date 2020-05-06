import getLog from './js/get-log'
import dropEventStore from './js/drop'
import { AdapterPool } from './types'

const dropSecretsStore = async (pool: AdapterPool): Promise<any> => {
  const log = getLog('dropSecretsStore')

  log.debug(`dropping secrets store database tables`)
  const { secretsTableName, escapeId } = pool
  log.verbose(`secretsTableName: ${secretsTableName}`)

  log.debug(`secrets store database tables are dropped`)
}

const drop = async (pool: AdapterPool): Promise<any> => {
  const log = getLog('drop')

  const { databaseName, tableName, executeStatement, escapeId } = pool

  const createDropEventStorePromise = (): Promise<any> =>
    databaseName && tableName && executeStatement && escapeId
      ? dropEventStore({
          databaseName,
          tableName,
          executeStatement,
          escapeId
        })
      : Promise.resolve()

  log.debug(`dropping the event store`)
  await Promise.all([createDropEventStorePromise(), dropSecretsStore(pool)])
  log.debug(`the event store dropped`)
}

export default drop
