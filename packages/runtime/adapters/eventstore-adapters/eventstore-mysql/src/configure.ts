import type {
  AdapterPoolPrimal,
  MysqlAdapterConfig,
  AdapterPool,
  ConfiguredProps,
} from './types'
import { escape, escapeId } from 'mysql2'
import connect from './connect'

const configure = (
  pool: AdapterPoolPrimal,
  config: MysqlAdapterConfig
): void => {
  const createGetConnectPromise = () => {
    let p: Promise<void>
    return () => {
      if (p === undefined) {
        p = connect(pool as AdapterPool)
      }
      return p
    }
  }

  const {
    database,
    eventsTableName,
    snapshotsTableName,
    secretsTableName,
    subscribersTableName,
    ...connectionOptions
  } = config

  const props: ConfiguredProps = {
    database: database,
    eventsTableName: eventsTableName ?? 'events',
    snapshotsTableName: snapshotsTableName ?? 'snapshots',
    secretsTableName: secretsTableName ?? 'secrets',
    subscribersTableName: subscribersTableName ?? 'subscribers',
    escape,
    escapeId,
    connectionOptions,
    createGetConnectPromise,
    getConnectPromise: createGetConnectPromise(),
    query: async (sql: string) => {
      await (pool as AdapterPool).getConnectPromise()
      if (pool.connection === undefined)
        throw new Error('Impossible state: connection must not be null')
      const connection = pool.connection
      return await connection.query(sql)
    },
    execute: async (sql: string) => {
      await (pool as AdapterPool).getConnectPromise()
      if (pool.connection === undefined)
        throw new Error('Impossible state: connection must not be null')
      const connection = pool.connection
      await connection.execute(sql)
    },
  }

  Object.assign<AdapterPoolPrimal, ConfiguredProps>(pool, props)
}

export default configure
