const adjustWebpackConfigs = webpackConfigs => {
  for (const webpackConfig of webpackConfigs) {
    const { entry, target } = webpackConfig
    if (
      Object.keys(entry).find(entry => entry.endsWith('/ssr.js')) != null &&
      target === 'node'
    ) {
      webpackConfig.externals = []
    }
  }
}

module.exports = adjustWebpackConfigs
