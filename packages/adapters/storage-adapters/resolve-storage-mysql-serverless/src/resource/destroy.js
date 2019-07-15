const destroy = async (pool, options) => {
  const { createAdapter } = pool

  const dynamoAdapter = createAdapter({
    awsSecretStoreArn: options.awsSecretStoreAdminArn,
    dbClusterOrInstanceArn: options.dbClusterOrInstanceArn,
    databaseName: 'mysql',
    resourceOptions: {
      databaseName: options.databaseName,
      userLogin: options.userLogin
    },
    skipInit: true
  })

  await dynamoAdapter.drop(options)
}

export default destroy
