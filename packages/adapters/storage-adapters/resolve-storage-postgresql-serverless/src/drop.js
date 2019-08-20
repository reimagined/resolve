const drop = async ({
  resourceOptions: { databaseName, userLogin },
  executeStatement,
  escapeId,
  escape
}) => {
  let alterSchemaError = null
  let dropSchemaError = null
  let dropUserError = null

  try {
    await executeStatement(
      `ALTER SCHEMA ${escapeId(databaseName)} OWNER TO SESSION_USER`
    )
  } catch (error) {
    alterSchemaError = error
  }

  try {
    await executeStatement(`DROP SCHEMA ${escapeId(databaseName)} CASCADE`)
  } catch (error) {
    dropSchemaError = error
  }

  try {
    await executeStatement(`
      SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE usename=${escape(
        userLogin
      )};
      DROP USER ${escapeId(userLogin)}
    `)
  } catch (error) {
    dropUserError = error
  }

  if (dropSchemaError != null || dropUserError != null) {
    const error = new Error()
    error.message = `${
      alterSchemaError != null ? `${alterSchemaError.message}\n` : ''
    }${dropSchemaError != null ? `${dropSchemaError.message}\n` : ''}${
      dropUserError != null ? `${dropUserError.message}\n` : ''
    }`

    throw error
  }
}

export default drop
