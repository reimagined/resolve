export default ({ resolveConfig }) => {
  const exports = []

  if (resolveConfig.hasOwnProperty('uploadAdapter')) {
    const { protocol, host, port, bucket } = resolveConfig.uploadAdapter.options
    exports.push(
      `const localS3Constants = {
        protocol: '${protocol}',
        host: '${host}',
        port: ${port},
        bucket: '${bucket}'
      }`,
      ``,
      `export default localS3Constants`
    )
  }

  return exports.join('\r\n')
}
