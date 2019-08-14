const fs = require('fs')

const { getResolveAllPackageJson } = require('./get-resolve-all-package-json')
const { getResolvePackages } = require('./get-resolve-packages')

const resolvePackages = getResolvePackages(true)

const patch = version => {
  const resolveAllPackageJson = getResolveAllPackageJson()

  for (const item of resolveAllPackageJson) {
    const packageJson = JSON.parse(fs.readFileSync(item.filePath))
    packageJson.version = version

    for (const namespace of [
      'dependencies',
      'devDependencies',
      'peerDependencies',
      'optionalDependencies'
    ]) {
      if (!packageJson[namespace]) {
        continue
      }
      if (packageJson[namespace]['@shopping-list-advanced/ui']) {
        packageJson[namespace]['@shopping-list-advanced/ui'] = version
      }
      for (const value of resolvePackages) {
        if (packageJson[namespace][value.name]) {
          packageJson[namespace][value.name] =
            namespace === 'peerDependencies' ? '*' : version
        }
      }
    }

    fs.writeFileSync(item.filePath, JSON.stringify(packageJson, null, 2))
  }
}

module.exports = { patch }
