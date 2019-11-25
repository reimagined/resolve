import { EOL } from 'os'

const destroy = async (pool, options) => {
  const { executeStatement, connect, escapeId, escape, dispose } = pool

  const admin = {
    config: {
      awsSecretStoreArn: options.awsSecretStoreAdminArn,
      dbClusterOrInstanceArn: options.dbClusterOrInstanceArn,
      databaseName: options.databaseName,
      tableName: options.tableName,
      region: options.region
    }
  }

  Object.assign(admin, pool)

  await connect(admin)

  let alterSchemaError = null
  let dropSchemaError = null
  let dropUserError = null

  try {
    await executeStatement(
      admin,
      `ALTER SCHEMA ${escapeId(options.databaseName)} OWNER TO SESSION_USER`
    )
  } catch (error) {
    alterSchemaError = error
  }

  try {
    await executeStatement(
      admin,
      `DROP SCHEMA ${escapeId(options.databaseName)} CASCADE`
    )
  } catch (error) {
    dropSchemaError = error
  }

  try {
    await executeStatement(
      admin,
      [
        `SELECT pg_terminate_backend(pid) `,
        `FROM pg_stat_activity `,
        `WHERE usename=${escape(options.userLogin)};`,
        `DROP USER ${escapeId(options.userLogin)}`
      ].join('')
    )
  } catch (error) {
    dropUserError = error
  }

  if (dropSchemaError != null || dropUserError != null) {
    const error = new Error()
    error.message = `${
      alterSchemaError != null ? `${alterSchemaError.message}${EOL}` : ''
    }${dropSchemaError != null ? `${dropSchemaError.message}${EOL}` : ''}${
      dropUserError != null ? `${dropUserError.message}${EOL}` : ''
    }`

    throw error
  }

  await dispose(admin)
}

export default destroy
