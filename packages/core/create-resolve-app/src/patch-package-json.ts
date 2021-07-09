import chalk from 'chalk'
import path from 'path'
import fs from 'fs-extra'
import { localRegistry as server, resolvePackages } from './constants'
import safeName from './safe-name'

const patchPackageJson = async (
  applicationName: string,
  applicationPath: string,
  localRegistry: boolean
) => {
  // eslint-disable-next-line no-console
  console.log(chalk.green('Patch package.json'))

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const resolveVersion = require(path.join(__dirname, '..', 'package.json'))
    .version

  const applicationPackageJsonPath = path.join(applicationPath, 'package.json')

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const applicationPackageJson = require(applicationPackageJsonPath)

  applicationPackageJson.name = applicationName

  const namespaces = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]

  fs.writeFileSync(
    applicationPackageJsonPath,
    JSON.stringify(applicationPackageJson, null, 2)
  )

  const localPackages = fs
    .readdirSync(applicationPath)
    .filter((directory) => {
      try {
        require(path.join(applicationPath, directory, 'package.json'))
        return true
      } catch (e) {
        return false
      }
    })
    .map((directory) => ({
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      name: require(path.join(applicationPath, directory, 'package.json')).name,
      directory: path.join(applicationPath, directory),
    }))

  localPackages.push({
    name: applicationName,
    directory: applicationPath,
  })

  for (const { directory } of localPackages) {
    const listPackageNamesForPatching = [
      ...resolvePackages,
      ...localPackages.map(({ name }) => name),
    ]

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const packageJson = require(path.join(directory, 'package.json'))

    packageJson.version = resolveVersion

    for (const namespace of namespaces) {
      if (packageJson[namespace]) {
        for (const packageName of Object.keys(packageJson[namespace])) {
          if (listPackageNamesForPatching.includes(packageName)) {
            packageJson[namespace][packageName] = localRegistry
              ? `${server.protocol}://${server.host}:${server.port}/${safeName(
                  packageName
                )}.tgz`
              : resolveVersion
          }
        }
      }
    }

    fs.writeFileSync(
      path.join(directory, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    )
  }
}

export default patchPackageJson
