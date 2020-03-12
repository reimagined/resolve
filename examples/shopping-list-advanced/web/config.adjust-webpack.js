const adjustWebpackConfigs = webpackConfigs => {
  for (const webpackConfig of webpackConfigs) {
    const { entry, target } = webpackConfig
    if (
      Object.keys(entry).find(entry => entry.endsWith('/ssr.js')) != null &&
      target === 'node'
    ) {
      webpackConfig.externals = []
    }
    if (
      Object.keys(entry).find(entry => entry.endsWith('/native-chunk.js')) !=
      null
    ) {
      console.log('!!!!!!!!!!!!!!')
      // const isExternal = /^((?!(resolve-redux|resolve-subscribe-socket\.io)).)*$/
      // const isNodeModule = /node_modules/
      webpackConfig.externals = [
        function(context, request, callback) {
          if (
            /(resolve-runtime|resolve-debug-levels|resolve-redux|resolve-subscribe-socket\.io)/.test(
              request
            )
          ) {
            console.log(request, context)
            callback()
          } else if (
            request[0] !== '/' &&
            request[0] !== '.' &&
            !request.startsWith('$resolve')
          ) {
            callback(null, `commonjs ${request}`)
          } else {
            console.log(request, context)
            callback()
          }
        }

        //
      ]
    }
  }
}

module.exports = adjustWebpackConfigs
