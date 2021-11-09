import type {
  AdapterPoolPrimal,
  SqliteAdapterConfig,
  AdapterPool,
  ConfiguredProps,
} from './types'

import executeStatement from './execute-statement'
import executeQuery from './execute-query'
import { validate } from '@resolve-js/eventstore-base'
import { SqliteAdapterConfigSchema } from './types'

const configure = (
  pool: AdapterPoolPrimal,
  config: SqliteAdapterConfig
): void => {
  const escapeId = (str: string): string =>
    `"${String(str).replace(/(["])/gi, '$1$1')}"`
  const escape = (str: string): string =>
    `'${String(str).replace(/(['])/gi, '$1$1')}'`

  validate(SqliteAdapterConfigSchema, config)

  const props: ConfiguredProps = {
    databaseFile: config.databaseFile ?? ':memory:',
    eventsTableName: config.eventsTableName ?? 'events',
    snapshotsTableName: config.snapshotsTableName ?? 'snapshots',
    secretsTableName: config.secretsTableName ?? 'secrets',
    subscribersTableName: config.subscribersTableName ?? 'subscribers',
    escape,
    escapeId,
    executeStatement: executeStatement.bind(null, pool as AdapterPool),
    executeQuery: executeQuery.bind(null, pool as AdapterPool),
    connecting: false,
  }

  Object.assign<AdapterPoolPrimal, ConfiguredProps>(pool, props)
}

export default configure
