const find = require('glob').sync

const { getResolveDir } = require('./get-resolve-dir')

let _resolveAllPackageJson
function getResolveAllPackageJson() {
  if (_resolveAllPackageJson) {
    return _resolveAllPackageJson
  }

  const resolveAllPackageJson = []

  for (const filePath of find('**/package.json', {
    cwd: getResolveDir(),
    absolute: true
  })) {
    if (
      filePath.includes('node_modules') ||
      filePath.includes('website') ||
      filePath.includes('/dist/') ||
      filePath.includes('\\dist\\')
    ) {
      continue
    }

    const { name } = require(filePath)

    resolveAllPackageJson.push({ name, filePath })
  }

  resolveAllPackageJson.sort((a, b) =>
    a.name > b.name ? 1 : a.name < b.name ? -1 : 0
  )

  _resolveAllPackageJson = resolveAllPackageJson

  return resolveAllPackageJson
}

module.exports = { getResolveAllPackageJson }
