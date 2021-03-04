const adjustWebpackConfigs = (webpackConfigs) => {
  for (const webpackConfig of webpackConfigs) {
    const { entry, target } = webpackConfig
    if (
      Object.keys(entry).find((entry) => entry.endsWith('/ssr.js')) != null &&
      target === 'node'
    ) {
      webpackConfig.externals = []
    }
    if (
      Object.keys(entry).find((entry) => entry.endsWith('/native-chunk.js')) !=
      null
    ) {
      webpackConfig.externals = [
        function (context, request, callback) {
          if (
            /(@resolve-js\/runtime|@resolve-js\/debug-levels|@resolve-js\/redux|@resolve-js\/subscribe-socket\.io)/.test(
              request
            )
          ) {
            callback()
          } else if (
            request[0] !== '/' &&
            request[0] !== '.' &&
            !request.startsWith('$resolve')
          ) {
            callback(null, `commonjs ${request}`)
          } else {
            callback()
          }
        },
      ]
    }
  }
}

module.exports = adjustWebpackConfigs
