const cloudCommonConfig = {
  mode: 'development',
  runtime: {
    module: '@resolve-js/runtime-aws-serverless-v2',
    options: { importMode: 'dynamic' },
  },
  readModelConnectors: {
    elasticSearch: {
      module: 'common/read-models/elastic-search-connector.ts',
      options: {
        /*
        node: "<your-cloud-elastic-search-host>:port",
        auth: {
          username: 'name',
          password: 'pass'
        }
        */
      },
    },
  },
}

export default cloudCommonConfig
