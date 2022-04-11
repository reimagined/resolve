import { declareRuntimeEnv } from '@resolve-js/scripts'
const cloudCommonConfig = {
  mode: 'production',
  runtime: {
    module: '@resolve-js/runtime-aws-serverless',
    options: { importMode: 'dynamic' },
  },
  staticPath: declareRuntimeEnv('RESOLVE_CLOUD_STATIC_URL'),
  readModelConnectors: {
    elasticSearch: {
      module: 'common/read-models/elastic-search-connector.js',
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
