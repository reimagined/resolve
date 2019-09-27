import { EOL } from 'os'

const destroy = async (pool, options) => {
  const { connect, disconnect, escapeId, escape } = pool
  const admin = {}

  await connect(
    admin,
    {
      awsSecretStoreArn: options.awsSecretStoreAdminArn,
      dbClusterOrInstanceArn: options.dbClusterOrInstanceArn,
      databaseName: options.databaseName,
      region: options.region
    }
  )

  let alterSchemaError = null
  let dropSchemaError = null
  let dropUserError = null

  try {
    await admin.executeStatement(
      `ALTER SCHEMA ${escapeId(options.databaseName)} OWNER TO SESSION_USER`
    )
  } catch (error) {
    alterSchemaError = error
  }

  try {
    await admin.executeStatement(
      `DROP SCHEMA ${escapeId(options.databaseName)} CASCADE`
    )
  } catch (error) {
    dropSchemaError = error
  }

  try {
    await admin.executeStatement(
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

  await disconnect(admin)
}

export default destroy
