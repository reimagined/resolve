import type {
  UnboundResourceMethod,
  CommonAdapterOptions,
  AdapterOptions,
  OmitObject,
  AdapterPool,
} from '../types'

const destroy: UnboundResourceMethod = async (pool, options) => {
  const { connect, disconnect, escapeId } = pool
  const admin = {} as AdapterPool

  await connect(admin, {
    host: options.host,
    port: options.port,
    user: options.user,
    password: options.password,
    database: 'mysql',
  } as OmitObject<AdapterOptions, CommonAdapterOptions>)

  let dropSchemaError: Error | null = null

  try {
    await admin.inlineLedgerRunQuery(
      `DROP DATABASE ${escapeId(options.database)} CASCADE`
    )
  } catch (error) {
    dropSchemaError = error
  }
  if (dropSchemaError) {
    throw dropSchemaError
  }

  await disconnect(admin)
}

export default destroy
