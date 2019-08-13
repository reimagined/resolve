const fs = require('fs')

const { getResolvePackages } = require('./get-resolve-packages')
const { getResolveExamples } = require('./get-resolve-examples')

const resolvePackages = getResolvePackages()

const putVersion = (list, version) => {
  for (const item of list) {
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
      for (const package of resolvePackages) {
        if (packageJson[namespace][package.name]) {
          packageJson[namespace][package.name] =
            namespace === 'peerDependencies'
              ? '*'
              : version
        }
      }
    }

    fs.writeFileSync(item.filePath, JSON.stringify(packageJson, null, 2))
  }
}

const patch = version => {
  const resolveExamples = getResolveExamples({ isSupportMonorepo: true, isIncludeDescription: false })

  putVersion(resolveExamples, version)
  putVersion(resolvePackages, version)
}

module.exports = { patch }
