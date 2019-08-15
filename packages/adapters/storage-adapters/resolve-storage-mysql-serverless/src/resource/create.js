const create = async (pool, options) => {
  const { createAdapter } = pool

  const adapter = createAdapter({
    awsSecretStoreArn: options.awsSecretStoreAdminArn,
    dbClusterOrInstanceArn: options.dbClusterOrInstanceArn,
    databaseName: 'mysql',
    region: options.region,
    resourceOptions: {
      databaseName: options.databaseName,
      tableName: options.tableName,
      userLogin: options.userLogin,
      userPassword: options.userPassword
    },
    skipInit: true
  })

  await adapter.init(options)
}

export default create
