const { getBabelConfig } = require('./get-babel-config')
const { getCompileConfigs } = require('./get-compile-configs')
const { getLocalRegistryConfig } = require('./get-local-registry-config')
const { getResolveDir } = require('./get-resolve-dir')
const { getResolveExamples } = require('./get-resolve-examples')
const { getResolvePackages } = require('./get-resolve-packages')
const { patchPackageJson } = require('./patch-package-json')
const { safeName } = require('./safe-name')

module.exports = {
  getBabelConfig,
  getCompileConfigs,
  getLocalRegistryConfig,
  getResolveDir,
  getResolveExamples,
  getResolvePackages,
  patchPackageJson,
  safeName
}
