import { message } from '../constants'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.localS3Server`
    )
  }

  return `
    import '$resolve.guardOnlyServer'
    import startS3Server from 'resolve-runtime/lib/local/start-s3-server.js'

    if(module.parent != null) {
      setImmediate(() => process.exit(1))
      throw new Error('S3 server should be launched as independent process')
    }

    (async () => {
      try {
        const options = {
          directory: '${resolveConfig.uploadAdapter.options.directory}',
          bucket: '${resolveConfig.uploadAdapter.options.bucket}',
          port: ${resolveConfig.uploadAdapter.options.port},
          secretKey: '${resolveConfig.uploadAdapter.options.secretKey}'
        }
        
        startS3Server(options)
      } catch(error) {
        console.error('S3 server has run into an error:', error)

        process.exit(1)
      }
    })()
  `
}
