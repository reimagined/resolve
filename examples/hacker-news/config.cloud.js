import cloudCommonConfig from './config.cloud.common'

export default {
  ...cloudCommonConfig,
  /*
  readModels: [
    {
      name: 'Replicator',
      projection: 'common/read-models/empty.js',
      resolvers: 'common/read-models/empty.js',
      connectorName: 'replicator',
    },
  ],
  readModelConnectors: {
    ...cloudCommonConfig.readModelConnectors,
    replicator: {
      module: '@resolve-js/replicator-via-api-handler',
      options: {
        targetApplicationUrl: 'http://localhost:3001',
      },
    },
  },*/
}
