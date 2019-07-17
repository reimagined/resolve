const create = async (pool, options) => {
  const { createAdapter } = pool

  const dynamoAdapter = createAdapter({
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

  await dynamoAdapter.init(options)
}

export default create
