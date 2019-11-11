import { message } from '../constants'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.localS3Server`
    )
  }

  return `
    import '$resolve.guardOnlyServer'
    import s3Server from 's3rver'

    if(module.parent != null) {
      setImmediate(() => process.exit(1))
      throw new Error('Event broker should be launched as independent process')
    }

    (async () => {
      try {
        new s3Server({
          port: ${resolveConfig.uploadAdapter.options.port},
          hostname: '${resolveConfig.uploadAdapter.options.host}',
          silent: true,
          directory: './${resolveConfig.uploadAdapter.options.directory}',
          configureBuckets: [{ name: '${resolveConfig.uploadAdapter.options.bucket}' }],
          allowMismatchedSignatures: true
        }).run(error => {
          if (error) {
            throw error
          }
        })
      } catch(error) {
        console.error('Event broker has run into an error:', error)

        process.exit(1)
      }
    })()
  `
}
