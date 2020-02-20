# **resolve-upload-cloud**

This package is cloud uploader adapter.

#### Config
```js
uploadAdapter: {
    module: 'resolve-upload-cloud',
    options: {
      encryptedDeploymentId: declareRuntimeEnv('RESOLVE_ENCRYPTED_DEPLOYMENT_ID'),
      deploymentId: declareRuntimeEnv('RESOLVE_DEPLOYMENT_ID'),
      CDN: declareRuntimeEnv('RESOLVE_UPLOADER_URL'),
      uploaderArn: declareRuntimeEnv('RESOLVE_UPLOADER_LAMBDA_ARN')
    }
  }
```
