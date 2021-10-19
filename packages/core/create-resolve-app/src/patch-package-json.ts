import chalk from 'chalk'
import path from 'path'
import fs from 'fs-extra'
import { localRegistry as server, resolvePackages } from './constants'
import { loadPackageJson, safeName } from './utils'

const patchPackageJson = async (
  applicationName: string,
  applicationPath: string,
  localRegistry: boolean
) => {
  // eslint-disable-next-line no-console
  console.log(chalk.green('Patch package.json'))

  const resolveVersion = loadPackageJson(
    path.join(__dirname, '..', 'package.json')
  ).version

  const applicationPackageJsonPath = path.join(applicationPath, 'package.json')

  const applicationPackageJson = loadPackageJson(applicationPackageJsonPath)

  applicationPackageJson.name = applicationName
  applicationPackageJson.version = resolveVersion

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
      name: loadPackageJson(
        path.join(applicationPath, directory, 'package.json')
      ).name,
      directory: path.join(applicationPath, directory),
    }))

  const directories = [
    applicationPath,
    ...localPackages.map(({ directory }) => directory),
  ]

  for (const directory of directories) {
    const listPackageNamesForPatching = [
      ...resolvePackages,
      ...localPackages.map(({ name }) => name),
    ]

    const packageJson = loadPackageJson(path.join(directory, 'package.json'))

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
