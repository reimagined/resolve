const find = require('glob').sync

const { getResolveDir, getResolvePackages } = require('@internal/helpers')

function getExamplePackagePaths() {
  const examplePackagePaths = []

  for (const filePath of find('./examples/**/package.json', {
    cwd: getResolveDir(),
    absolute: true
  })) {
    if (filePath.includes('node_modules') || filePath.includes('dist')) {
      continue
    }

    examplePackagePaths.push(filePath)
  }

  return examplePackagePaths
}

console.log(getExamplePackagePaths())

console.log(getResolvePackages())

module.exports = { getExamplePackagePaths }