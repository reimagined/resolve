import cloudCommonConfig from './config.cloud.common'

const cloudConfig = {
  ...cloudCommonConfig,
  /*readModels: [
    {
      name: 'Replicator',
      projection: 'common/read-models/empty.ts',
      resolvers: 'common/read-models/empty.ts',
      connectorName: 'replicator',
    },
  ],
  readModelConnectors: {
    ...cloudCommonConfig.readModelConnectors,
    replicator: {
      module: '@resolve-js/replicator-via-api-handler',
      options: {
        targetApplicationUrl: declareRuntimeEnv('TARGET_REPLICATION_URL', ''),
      },
    },
  },*/
}

export default cloudConfig
