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
    databaseName: options.databaseName,
    host: options.host,
    port: options.port,
    user: options.user,
    password: options.password,
    database: options.database,
  } as OmitObject<AdapterOptions, CommonAdapterOptions>)

  try {
    await admin.inlineLedgerRunQuery(
      [
        `CREATE SCHEMA ${escapeId(options.databaseName)}`,

        `CREATE TABLE ${escapeId(options.databaseName)}.${escapeId(
          `__${options.databaseName}__LEDGER__`
        )}(
        "EventSubscriber" VARCHAR(190) NOT NULL,
        "IsPaused" BOOLEAN NOT NULL,
        "EventTypes" JSONB NOT NULL,
        "AggregateIds" JSONB NOT NULL,
        "XaKey" VARCHAR(190) NULL,
        "Cursor" JSONB NULL,
        "SuccessEvent" JSONB NULL,
        "FailedEvent" JSONB NULL,
        "Errors" JSONB NULL,
        "Schema" JSONB NULL,
        PRIMARY KEY("EventSubscriber")
      )`,

        `CREATE TABLE ${escapeId(options.databaseName)}.${escapeId(
          `__${options.databaseName}__TRX__`
        )}(
        "XaKey" VARCHAR(190) NOT NULL,
        "XaValue" VARCHAR(190) NOT NULL,
        "Timestamp" BIGINT,
        PRIMARY KEY("XaKey")
      )`,

        `GRANT USAGE ON SCHEMA ${escapeId(options.databaseName)} TO ${escapeId(
          options.userLogin
        )}`,

        `GRANT ALL ON SCHEMA ${escapeId(options.databaseName)} TO ${escapeId(
          options.userLogin
        )}`,

        `GRANT ALL ON ALL TABLES IN SCHEMA ${escapeId(
          options.databaseName
        )} TO ${escapeId(options.userLogin)}`,

        `GRANT ALL ON ALL SEQUENCES IN SCHEMA ${escapeId(
          options.databaseName
        )} TO ${escapeId(options.userLogin)}`,

        `GRANT ALL ON ALL FUNCTIONS IN SCHEMA ${escapeId(
          options.databaseName
        )} TO ${escapeId(options.userLogin)}`,

        `ALTER SCHEMA ${escapeId(options.databaseName)} OWNER TO ${escapeId(
          options.userLogin
        )}`,
      ].join('; ')
    )
  } catch (error) {
    throw error
  } finally {
    await disconnect(admin)
  }
}

export default create
