import { declareRuntimeEnv } from '@resolve-js/scripts'
const configCloud = {
  mode: 'production',
  runtime: {
    module: '@resolve-js/runtime-aws-serverless',
    options: { importMode: 'dynamic' },
  },
  staticPath: declareRuntimeEnv('RESOLVE_CLOUD_STATIC_URL'),
}
export default configCloud
