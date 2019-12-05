export default ({ resolveConfig }) => {
  const exports = []

  if (resolveConfig.hasOwnProperty('uploadAdapter')) {
    if (resolveConfig.uploadAdapter.module === 'resolve-upload-local') {
      const { protocol, host, port } = resolveConfig.uploadAdapter.options
      exports.push(
        `const localS3Constants = {
        CDNUrl: '${protocol}://${host}:${port}'
      }`,
        ``,
        `export default localS3Constants`
      )
    } else {
      const { CDN, deploymentId } = resolveConfig.uploadAdapter.options
      exports.push(
        `const localS3Constants = {
        CDNUrl: 'https://${CDN}/${deploymentId}'
      }`,
        ``,
        `export default localS3Constants`
      )
    }
  }

  return exports.join('\r\n')
}
