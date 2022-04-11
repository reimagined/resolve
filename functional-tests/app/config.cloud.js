import { declareRuntimeEnv } from '@resolve-js/scripts'

const cloudConfig = {
  mode: 'production',
  runtime: {
    module: '@resolve-js/runtime-aws-serverless',
    options: { importMode: 'dynamic' },
  },
  uploadAdapter: {
    options: {
      encryptedUserId: declareRuntimeEnv('RESOLVE_ENCRYPTED_USER_ID'),
      userId: declareRuntimeEnv('RESOLVE_USER_ID'),
      CDN: declareRuntimeEnv('RESOLVE_UPLOADER_URL'),
      uploaderArn: declareRuntimeEnv('RESOLVE_UPLOADER_LAMBDA_ARN'),
      scope: 'functional-tests',
    },
  },
}

export default cloudConfig
