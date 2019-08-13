const fs = require('fs')

const { getResolvePackages } = require('./get-resolve-packages')
const { getResolveExamples } = require('./get-resolve-examples')

const patchPackageJson = version => {
  const resolvePackages = getResolvePackages()
  const resolveExamples = getResolveExamples({ isSupportMonorepo: true, isIncludeDescription: false })

  for (const example of resolveExamples) {
    const packageJson = JSON.parse(fs.readFileSync(example.filePath))

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
              : `"${version}"`
        }
      }
    }

    fs.writeFileSync(example.filePath, JSON.stringify(packageJson, null, 2))
  }
}

module.exports = { patchPackageJson }
