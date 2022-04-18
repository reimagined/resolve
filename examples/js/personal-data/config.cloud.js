import { declareRuntimeEnv } from '@resolve-js/scripts'
const cloudConfig = {
  mode: 'production',
  runtime: {
    module: '@resolve-js/runtime-aws-serverless',
    options: {
      importMode: 'dynamic',
    },
  },
  uploadAdapter: {
    options: {
      CDN: declareRuntimeEnv('RESOLVE_UPLOADER_URL'),
      uploaderArn: declareRuntimeEnv('RESOLVE_UPLOADER_LAMBDA_ARN'),
    },
  },
}
export default cloudConfig
