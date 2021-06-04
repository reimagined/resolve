import { EOL } from 'os'
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
    databaseName: options.databaseName,
    host: options.host,
    port: options.port,
    user: options.user,
    password: options.password,
    database: options.database,
  } as OmitObject<AdapterOptions, CommonAdapterOptions>)

  let alterSchemaError: Error | null = null
  let dropSchemaError: Error | null = null

  try {
    await admin.inlineLedgerRunQuery(
      `ALTER SCHEMA ${escapeId(options.databaseName)} OWNER TO SESSION_USER`
    )
  } catch (error) {
    alterSchemaError = error
  }

  try {
    await admin.inlineLedgerRunQuery(
      `DROP SCHEMA ${escapeId(options.databaseName)} CASCADE`
    )
  } catch (error) {
    dropSchemaError = error
  }

  await disconnect(admin)

  if (dropSchemaError != null || alterSchemaError != null) {
    const error = new Error()
    error.message = `${
      alterSchemaError != null ? `${alterSchemaError.message}${EOL}` : ''
    }${dropSchemaError != null ? `${dropSchemaError.message}${EOL}` : ''}`

    throw error
  }
}

export default destroy
