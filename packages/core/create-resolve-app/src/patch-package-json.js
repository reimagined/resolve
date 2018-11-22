const patchPackageJson = ({
  console,
  chalk,
  path,
  fs,
  applicationName,
  applicationPackageJsonPath,
  resolvePackages
}) => async () => {
  console.log()
  console.log(chalk.green('Patch package.json'))

  const resolveVersion = require(path.join(__dirname, '..', 'package.json'))
    .version

  const packageJson = require(applicationPackageJsonPath)

  packageJson.name = applicationName
  packageJson.version = resolveVersion

  const namespaces = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies'
  ]

  for (const namespace of namespaces) {
    if (packageJson[namespace]) {
      for (const packageName of Object.keys(packageJson[namespace])) {
        if (resolvePackages.includes(packageName)) {
          packageJson[namespace][packageName] = resolveVersion
        }
      }
    }
  }

  fs.writeFileSync(
    applicationPackageJsonPath,
    JSON.stringify(packageJson, null, 2)
  )
}

export default patchPackageJson
