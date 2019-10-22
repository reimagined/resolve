import { EOL } from 'os'

const destroy = async (pool, options) => {
  const {
    executeStatement,
    connect,
    RDSDataService,
    escapeId,
    escape,
    fullJitter,
    coercer,
    dispose
  } = pool

  const admin = {
    config: {
      awsSecretStoreArn: options.awsSecretStoreAdminArn,
      dbClusterOrInstanceArn: options.dbClusterOrInstanceArn,
      databaseName: options.databaseName,
      tableName: options.tableName,
      region: options.region
    }
  }
  await connect(
    admin,
    {
      RDSDataService,
      escapeId,
      escape,
      fullJitter,
      executeStatement,
      coercer
    }
  )

  let alterSchemaError = null
  let dropSchemaError = null

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

  if (alterSchemaError != null || dropSchemaError != null) {
    const error = new Error()
    error.message = `${
      alterSchemaError != null ? `${alterSchemaError.message}${EOL}` : ''
    }${dropSchemaError != null ? `${dropSchemaError.message}${EOL}` : ''}`

    throw error
  }

  await dispose(admin)
}

export default destroy
