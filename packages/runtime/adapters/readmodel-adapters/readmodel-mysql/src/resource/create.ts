import type {
  UnboundResourceMethod,
  CommonAdapterOptions,
  AdapterOptions,
  OmitObject,
  AdapterPool,
} from '../types'

const create: UnboundResourceMethod = async (pool, options) => {
  const { connect, disconnect, escapeId } = pool
  const admin = {} as AdapterPool

  await connect(admin, {
    host: options.host,
    port: options.port,
    user: options.user,
    password: options.password,
    database: 'mysql',
  } as OmitObject<AdapterOptions, CommonAdapterOptions>)

  await admin.inlineLedgerRunQuery(
    [
      `CREATE DATABASE ${escapeId(options.database)}`,

      `CREATE TABLE IF NOT EXISTS ${escapeId(options.database)}.${escapeId(
        `__${options.database}__LEDGER__`
      )}(
      \`EventSubscriber\` VARCHAR(190) NOT NULL,
      \`IsPaused\` TINYINT NOT NULL,
      \`EventTypes\` JSON NOT NULL,
      \`AggregateIds\` JSON NOT NULL,
      \`XaKey\` VARCHAR(190) NULL,
      \`Cursor\` JSON NULL,
      \`SuccessEvent\` JSON NULL,
      \`FailedEvent\` JSON NULL,
      \`Errors\` JSON NULL,
      \`Schema\` JSON NULL,
      PRIMARY KEY(\`EventSubscriber\`)
    )`,

      `CREATE TABLE IF NOT EXISTS ${escapeId(options.database)}.${escapeId(
        `__${options.database}__TRX__`
      )}(
      \`XaKey\` VARCHAR(190) NOT NULL,
      \`XaValue\` VARCHAR(190) NOT NULL,
      \`Timestamp\` BIGINT,
      PRIMARY KEY(\`XaKey\`)
    )`,
    ].join('; ')
  )

  await disconnect(admin)
}

export default create
