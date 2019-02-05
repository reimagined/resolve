const path = require('path')
const find = require('glob').sync

const { getResolveDir } = require('./get-resolve-dir')

let _resolvePackages
function getResolvePackages() {
  if (_resolvePackages) {
    return _resolvePackages
  }

  const resolvePackages = []

  for (const filePath of find('./packages/**/package.json', {
    cwd: getResolveDir(),
    absolute: true
  })) {
    if (filePath.includes('node_modules')) {
      continue
    }
    if (filePath.includes(path.join('packages', 'internal'))) {
      continue
    }

    const { name } = require(filePath)

    resolvePackages.push(name)
  }

  resolvePackages.sort((a, b) => (a > b ? 1 : a < b ? -1 : 0))

  _resolvePackages = resolvePackages

  return resolvePackages
}

module.exports = { getResolvePackages }
