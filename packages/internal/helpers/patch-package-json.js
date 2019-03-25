const fs = require('fs')
const path = require('path')

const { getResolvePackages } = require('./get-resolve-packages')
const { getLocalRegistryConfig } = require('./get-local-registry-config')
const { safeName } = require('./safe-name')

const patchPackageJson = directory => {
  const resolvePackages = getResolvePackages()
  const localRegistry = getLocalRegistryConfig()

  fs.copyFileSync(
    path.join(directory, 'package.json'),
    path.join(directory, 'package.backup.json')
  )
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(directory, 'package.json'))
  )
  for (const namespace of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies'
  ]) {
    if (!packageJson[namespace]) {
      continue
    }
    for (const name of resolvePackages) {
      if (packageJson[namespace][name]) {
        packageJson[namespace][name] =
          namespace === 'peerDependencies'
            ? '*'
            : `${localRegistry.protocol}://${localRegistry.host}:${
                localRegistry.port
              }/${safeName(name)}`
      }
    }
  }

  fs.writeFileSync(
    path.join(directory, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  )
  if (!fs.existsSync(localRegistry.directory)) {
    fs.mkdirSync(localRegistry.directory)
  }

  let isAlreadyRollback = false
  const rollback = () => {
    if (isAlreadyRollback) {
      return
    }
    if (fs.existsSync(path.join(directory, 'package.backup.json'))) {
      fs.unlinkSync(path.join(directory, 'package.json'))
      fs.renameSync(
        path.join(directory, 'package.backup.json'),
        path.join(directory, 'package.json')
      )
      isAlreadyRollback = true
    }
  }

  process.setMaxListeners(process.getMaxListeners() + 2)
  process.on('SIGINT', rollback)
  process.on('exit', rollback)

  return rollback
}

module.exports = { patchPackageJson }
