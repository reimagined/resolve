const path = require('path')

const { getResolveDir } = require('./get-resolve-dir')

const getLocalRegistryConfig = () => ({
  protocol: 'http',
  host: '0.0.0.0',
  port: 10080,
  directory: path.join(getResolveDir(), '.packages')
})

module.exports = { getLocalRegistryConfig }
