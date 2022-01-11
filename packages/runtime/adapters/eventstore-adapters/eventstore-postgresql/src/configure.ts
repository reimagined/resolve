import type {
  AdapterPoolPrimal,
  PostgresqlAdapterConfig,
  AdapterPool,
  ConfiguredProps,
} from './types'

import escapeId from './escape-id'
import escape from './escape'
import { Client as Postgres } from 'pg'
import fullJitter from './full-jitter'
import executeStatement from './execute-statement'
import connect from './connect'

const configure = (
  pool: AdapterPoolPrimal,
  config: PostgresqlAdapterConfig
): void => {
  const createGetConnectPromise = () => {
    let p: ReturnType<typeof connect>
    return () => {
      if (p === undefined) {
        p = connect(pool as AdapterPool)
      }
      return p
    }
  }

  const props: ConfiguredProps = {
    databaseName: config.databaseName,
    eventsTableName: config.eventsTableName ?? 'events',
    snapshotsTableName: config.snapshotsTableName ?? 'snapshots',
    secretsTableName: config.secretsTableName ?? 'secrets',
    subscribersTableName: config.subscribersTableName ?? 'subscribers',
    connectionOptions: {
      user: config.user,
      database: config.database,
      port: config.port,
      host: config.host,
      password: config.password,
    },
    Postgres,
    fullJitter,
    escape,
    escapeId,
    executeStatement: executeStatement.bind(null, pool as AdapterPool),
    createGetConnectPromise,
    getConnectPromise: createGetConnectPromise(),
    extraConnections: new Set(),
    eventLoaders: new Set(),
  }

  Object.assign<AdapterPoolPrimal, ConfiguredProps>(pool, props)
}

export default configure
